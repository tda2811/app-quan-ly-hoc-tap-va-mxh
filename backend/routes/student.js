const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const cleanName = file.originalname
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9.-]/g, "");
        cb(null, Date.now() + '-' + cleanName);
    }
});

const upload = multer({ storage });

/**
 * Danh sách Bài viết cho Feed (Tất cả hoặc theo nhóm)
 */
router.get('/posts', async (req, res) => {
    const { group_id } = req.query;
    try {
        let query = `
            SELECT p.*, u.email, s.full_name, g.name as group_name, pm.media_url, pm.media_type
            FROM posts p 
            JOIN users u ON p.user_id = u.id
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN groups_table g ON p.group_id = g.id
            LEFT JOIN post_media pm ON p.id = pm.post_id
        `;
        let params = [];
        if (group_id) {
            query += ' WHERE p.group_id = ?';
            params.push(group_id);
        }
        query += ' ORDER BY p.created_at DESC LIMIT 50';

        const [posts] = await db.query(query, params);
        res.json({ success: true, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy bài viết: ' + error.message });
    }
});

/**
 * Đăng bài viết mới - Hỗ trợ tài chọn liệu/ảnh
 */
router.post('/posts', upload.single('file'), async (req, res) => {
    const { user_id, group_id, content } = req.body;
    if (!user_id || !content) return res.status(400).json({ success: false, message: 'Thiếu thông tin Đăng bài' });
    
    try {
        const [result] = await db.query(
            'INSERT INTO posts (user_id, group_id, content) VALUES (?, ?, ?)',
            [user_id, group_id || null, content]
        );
        const postId = result.insertId;

        if (req.file) {
            const fileUrl = `/uploads/${req.file.filename}`;
            const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
            await db.query(
                'INSERT INTO post_media (post_id, media_url, media_type) VALUES (?, ?, ?)',
                [postId, fileUrl, fileType]
            );
        }

        res.json({ success: true, message: 'Đăng bài viết thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi Đăng bài: ' + error.message });
    }
});

/**
 * Danh sách Điểm số của Sinh viên
 */
router.get('/grades', async (req, res) => {
    const { student_id } = req.query;
    if (!student_id) return res.status(400).json({ success: false, message: 'Thiếu student_id' });

    try {
        const [grades] = await db.query(`
            SELECT g.*, sub.name as subject_name 
            FROM student_enrollments se
            JOIN grades g ON se.id = g.enrollment_id
            JOIN subjects sub ON se.subject_id = sub.id
            WHERE se.student_id = ?
        `, [student_id]);
        
        res.json({ success: true, data: grades });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy điểm số: ' + error.message });
    }
});

/**
 * Thích bài viết
 */
router.post('/posts/like', async (req, res) => {
    const { user_id, post_id } = req.body;
    try {
        const [exists] = await db.query('SELECT id FROM likes WHERE target_type = "post" AND target_id = ? AND user_id = ?', [post_id, user_id]);
        if (exists.length > 0) {
            await db.query('DELETE FROM likes WHERE target_type = "post" AND target_id = ? AND user_id = ?', [post_id, user_id]);
            await db.query('UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [post_id]);
            return res.json({ success: true, message: 'Đã bỏ thích.' });
        }
        await db.query('INSERT INTO likes (target_type, target_id, user_id) VALUES ("post", ?, ?)', [post_id, user_id]);
        await db.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [post_id]);
        res.json({ success: true, message: 'Đã thích bài viết.' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * Lấy danh sách Thông báo
 */
router.get('/notifications', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });
    try {
        const [notifs] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [user_id]);
        res.json({ success: true, data: notifs });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * Lịch học của Sinh viên
 */
router.get('/schedules', async (req, res) => {
    const { student_id } = req.query;
    if (!student_id) return res.status(400).json({ success: false, message: 'Thiếu student_id' });

    try {
        const [schedules] = await db.query(`
            SELECT s.*, sub.name as subject_name 
            FROM student_enrollments se
            JOIN schedules s ON se.subject_id = s.subject_id
            JOIN subjects sub ON se.subject_id = sub.id
            WHERE se.student_id = ?
            ORDER BY s.schedule_date DESC
        `, [student_id]);
        
        res.json({ success: true, data: schedules });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy lịch học: ' + error.message });
    }
});

/**
 * Danh sách Tài liệu học tập của Sinh viên (Theo môn đăng ký)
 */
router.get('/documents', async (req, res) => {
    const { student_id } = req.query;
    if (!student_id) return res.status(400).json({ success: false, message: 'Thiếu student_id' });

    try {
        const [docs] = await db.query(`
            SELECT d.*, sub.name as subject_name, u.email as uploader_email
            FROM student_enrollments se
            JOIN documents d ON se.subject_id = d.subject_id
            JOIN subjects sub ON d.subject_id = sub.id
            LEFT JOIN users u ON d.uploader_id = u.id
            WHERE se.student_id = ?
            ORDER BY d.created_at DESC
        `, [student_id]);
        
        res.json({ success: true, data: docs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy tài liệu: ' + error.message });
    }
});

/**
 * Lấy danh sách Bình luận của bài viết
 */
router.get('/posts/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    try {
        const [comments] = await db.query(`
            SELECT c.*, u.email, s.full_name 
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            LEFT JOIN students s ON u.id = s.user_id 
            WHERE c.post_id = ? 
            ORDER BY c.created_at ASC
        `, [postId]);
        res.json({ success: true, data: comments });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * Đăng bình luận mới
 */
router.post('/posts/comment', async (req, res) => {
    const { user_id, post_id, content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Nội dung bình luận không được trống.' });
    try {
        await db.query('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [post_id, user_id, content]);
        await db.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [post_id]);
        res.json({ success: true, message: 'Đã gửi bình luận.' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * Lấy danh sách Nhóm mà Sinh viên đang tham gia
 */
router.get('/my-groups', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });
    try {
        const [groups] = await db.query(`
            SELECT g.* 
            FROM groups_table g
            JOIN group_members gm ON g.id = gm.group_id
            WHERE gm.user_id = ?
        `, [user_id]);
        res.json({ success: true, data: groups });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * Lấy lịch sử Điểm danh của Sinh viên
 */
router.get('/attendances', async (req, res) => {
    const { student_id } = req.query;
    if (!student_id) return res.status(400).json({ success: false, message: 'Thiếu student_id' });

    try {
        const [history] = await db.query(`
            SELECT a.*, s.schedule_date, s.start_time, sub.name as subject_name, u.email as teacher_email
            FROM attendances a
            JOIN schedules s ON a.schedule_id = s.id
            JOIN subjects sub ON s.subject_id = sub.id
            LEFT JOIN users u ON s.teacher_id = u.id
            WHERE a.student_id = ?
            ORDER BY s.schedule_date DESC, s.start_time DESC
        `, [student_id]);
        
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử điểm danh: ' + error.message });
    }
});

/**
 * Lấy tất cả các Nhóm có sẵn để tham gia
 */
router.get('/all-groups', async (req, res) => {
    const { user_id } = req.query;
    try {
        // Lấy tất cả groups và đánh dấu những group user đã tham gia
        const [groups] = await db.query(`
            SELECT g.*, 
                   (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
                   (SELECT role FROM group_members WHERE group_id = g.id AND user_id = ?) as joined_role
            FROM groups_table g
        `, [user_id]);
        res.json({ success: true, data: groups });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * Tham gia vào một Nhóm
 */
router.post('/groups/join', async (req, res) => {
    const { user_id, group_id } = req.body;
    if (!user_id || !group_id) return res.status(400).json({ success: false, message: 'Thiếu user_id hoặc group_id' });

    try {
        // Kiểm tra xem đã tham gia chưa
        const [exists] = await db.query('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [group_id, user_id]);
        if (exists.length > 0) {
            return res.status(400).json({ success: false, message: 'Bạn đã là thành viên của nhóm này rồi.' });
        }

        await db.query('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, "member")', [group_id, user_id]);
        res.json({ success: true, message: 'Tham gia nhóm thành công!' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
