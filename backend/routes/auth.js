const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * Xử lý Đăng ký tài khoản mới 
 */
router.post('/register', async (req, res) => {
    const { email, password, role, fullName, studentCode } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Vui lòng điền đủ email, mật khẩu và vai trò!' });
    }

    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Email này đã được sử dụng!' });

        const userId = uuidv4();

        // --- DEBUG PASSWORD ---
        console.log('--- REGISTER DEBUG ---');
        console.log('Email:', email);
        console.log('Mật khẩu thô:', password);

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Mật khẩu sau khi Hash:', hashedPassword);
        console.log('-----------------------');

        // Tạo Transaction để đảm bảo tính toàn vẹn (User + Student profile)
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            await connection.query(
                'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [userId, email, hashedPassword, role]
            );

            if (role === 'student') {
                await connection.query(
                    'INSERT INTO students (user_id, student_code, full_name) VALUES (?, ?, ?)',
                    [userId, studentCode || `SV${Date.now()}`, fullName || 'New Student']
                );
            }

            await connection.commit();
            res.status(201).json({ success: true, message: 'Đăng ký tài khoản thành công!' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Lỗi register:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
    }
});

/**
 * Xử lý Đăng nhập & Trả về Token
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // --- DEBUG LOGIN ---
    console.log('--- LOGIN ATTEMPT ---');
    console.log('Email:', email);
    console.log('Password nhận được:', password);

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND status = "active"', [email]);
        if (users.length === 0) {
            console.log('=> Thất bại: Email không tồn tại');
            return res.status(404).json({ message: 'Tài khoản không tồn tại hoặc bị khóa.' });
        }

        const user = users[0];

        // --- DEBUG COMPARE ---
        console.log('Mật khẩu thô gửi lên:', password);
        console.log('Hash lưu trong DB:   ', user.password_hash);
        
        // Hash thử mật khẩu vừa nhập để xem (Lưu ý: Bcrypt hash mỗi lần sẽ ra khác nhau do Salt, nhưng login vẫn khớp)
        const debugHash = await bcrypt.hash(password, 10);
        console.log('Hash của pass vừa nhập:', debugHash);
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('Kết quả so sánh Bcrypt:', isValid);

        if (!isValid) {
            console.log('=> Thất bại: Sai mật khẩu');
            return res.status(401).json({ message: 'Mật khẩu không chính xác.' });
        }

        console.log('=> Đăng nhập thành công:', user.email);

        let userInfo = { id: user.id, email: user.email, role: user.role };
        if (user.role === 'student') {
            const [profiles] = await db.query('SELECT full_name, avatar_url FROM students WHERE user_id = ?', [user.id]);
            if (profiles.length > 0) userInfo = { ...userInfo, ...profiles[0] };
        }

        if (user.role === 'admin') {
            const [profiles] = await db.query('SELECT full_name, avatar_url FROM students WHERE user_id = ?', [user.id]);
            if (profiles.length > 0) userInfo = { ...userInfo, ...profiles[0] };
        }
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'SecretKeyEduConnect',
            { expiresIn: '30d' }
        );

        res.json({ success: true, data: { token, user: userInfo } });
    } catch (error) {
        console.error('Lỗi login server:', error);
        res.status(500).json({ message: 'Lỗi login server.' });
    }
});


module.exports = router;

