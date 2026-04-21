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

router.get('/stats', async (req, res) => {
    try {
        const [[{ count: studentCount }]] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "student"');
        const [[{ count: teacherCount }]] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "teacher"');
        const [[{ count: classCount }]] = await db.query('SELECT COUNT(*) as count FROM classes');
        const [[{ count: majorCount }]] = await db.query('SELECT COUNT(*) as count FROM majors');

        res.json({
            success: true,
            data: {
                studentCount,
                teacherCount,
                classCount,
                majorCount
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy thống kê dashboard.' });
    }
});

/**
 * Lấy danh sách toàn bộ User
 */
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT u.id, u.email, u.role, u.status, s.full_name, s.student_code, s.class_id, s.major_id 
            FROM users u 
            LEFT JOIN students s ON u.id = s.user_id
        `);
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách user.' });
    }
});

/**
 * Danh mục Ngành học & Lớp học
 */
router.get('/majors', async (req, res) => {
    const [majors] = await db.query('SELECT * FROM majors');
    res.json({ success: true, data: majors });
});

router.get('/classes', async (req, res) => {
    try {
        const [classes] = await db.query(`
            SELECT c.*, m.name as major_name, m.code as major_code 
            FROM classes c 
            LEFT JOIN majors m ON c.major_id = m.id
        `);
        res.json({ success: true, data: classes });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách lớp.' });
    }
});

/**
 * Danh mục Môn học (Subjects)
 */
router.get('/subjects', async (req, res) => {
    try {
        const [subjects] = await db.query('SELECT * FROM subjects');
        res.json({ success: true, data: subjects });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách môn học.' });
    }
});

/**
 * Quản lý Nhóm Chat (Groups)
 */
router.get('/groups', async (req, res) => {
    try {
        const [groups] = await db.query(`
            SELECT g.*, COUNT(gm.user_id) as member_count 
            FROM groups_table g 
            LEFT JOIN group_members gm ON g.id = gm.group_id 
            GROUP BY g.id
        `);
        res.json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách Nhóm.' });
    }
});

router.post('/groups', async (req, res) => {
    const { name, group_type } = req.body;
    try {
        await db.query('INSERT INTO groups_table (name, group_type) VALUES (?, ?)', [name, group_type]);
        res.json({ success: true, message: 'Tạo nhóm mới thành công.' });
    } catch (error) {
        console.error('Create Group SQL Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo nhóm: ' + error.message });
    }
});

router.put('/groups/:id', async (req, res) => {
    const { id } = req.params;
    const { name, group_type } = req.body;
    try {
        await db.query('UPDATE groups_table SET name = ?, group_type = ? WHERE id = ?', [name, group_type, id]);
        res.json({ success: true, message: 'Cập nhật nhóm thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật nhóm.' });
    }
});

/**
 * QUẢN LÝ THÀNH VIÊN NHÓM
 */
router.get('/groups/:id/members', async (req, res) => {
    const { id } = req.params;
    try {
        const [members] = await db.query(`
            SELECT gm.user_id, u.email, s.full_name, s.student_code 
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            LEFT JOIN students s ON u.id = s.user_id
            WHERE gm.group_id = ?
        `, [id]);
        res.json({ success: true, data: members });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách thành viên.' });
    }
});

router.post('/groups/:id/members', async (req, res) => {
    const { id } = req.params;
    const { email } = req.body; // Thêm bằng Email cho tiện
    try {
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        
        const userId = users[0].id;
        
        const [exists] = await db.query('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId]);
        if (exists.length > 0) return res.status(400).json({ success: false, message: 'Người dùng đã có trong nhóm.' });

        await db.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [id, userId]);
        res.json({ success: true, message: 'Thêm thành viên thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi thêm thành viên.' });
    }
});

/**
 * THÊM NHIỀU THÀNH VIÊN BULK
 */
router.post('/groups/:id/members/bulk', async (req, res) => {
    const { id } = req.params;
    const { userIds } = req.body; // Array of IDs [1, 2, 3]
    if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ.' });
    try {
        const values = userIds.map(uId => [id, uId]);
        await db.query('INSERT IGNORE INTO group_members (group_id, user_id) VALUES ?', [values]);
        res.json({ success: true, message: 'Đã thêm hàng loạt thành viên thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi thêm hàng loạt thành viên.' });
    }
});

router.delete('/groups/:id/members/:userId', async (req, res) => {
    const { id, userId } = req.params;
    try {
        await db.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId]);
        res.json({ success: true, message: 'Đã xóa thành viên khỏi nhóm.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa thành viên.' });
    }
});

router.delete('/groups/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM groups_table WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa nhóm thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa nhóm.' });
    }
});

/**
 * Thêm Ngành học mới
 */
router.post('/majors', async (req, res) => {
    const { code, name } = req.body;
    try {
        await db.query('INSERT INTO majors (code, name) VALUES (?, ?)', [code, name]);
        res.json({ success: true, message: 'Đã thêm ngành học mới.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thêm ngành học.' });
    }
});

/**
 * Thêm Lớp học mới
 */
router.post('/classes', async (req, res) => {
    const { name, major_id, cohort } = req.body;
    try {
        await db.query('INSERT INTO classes (name, major_id, cohort) VALUES (?, ?, ?)', [name, major_id, cohort]);
        res.json({ success: true, message: 'Đã thêm lớp học mới.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thêm lớp học.' });
    }
});

/**
 * Cập nhật hồ sơ sinh viên (Phân lớp, ngành)
 */
router.put('/students/:id', async (req, res) => {
    const { id } = req.params;
    const { class_id, major_id, full_name, bio } = req.body;
    try {
        await db.query(`
            UPDATE students 
            SET class_id = ?, major_id = ?, full_name = ?, bio = ? 
            WHERE user_id = ?
        `, [class_id, major_id, full_name, bio, id]);
        res.json({ success: true, message: 'Cập nhật sinh viên thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật sinh viên.' });
    }
});

/**
 * Cập nhật User (Quyền, Trạng thái)
 */
router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { role, status } = req.body;
    try {
        await db.query('UPDATE users SET role = ?, status = ? WHERE id = ?', [role, status, id]);
        res.json({ success: true, message: 'Cập nhật user thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật user.' });
    }
});

/**
 * Xóa User
 */
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Có thể cần xóa cascading students/teachers profile trước
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa user thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa user.' });
    }
});

/**
 * Cập nhật Lớp học
 */
router.put('/classes/:id', async (req, res) => {
    const { id } = req.params;
    const { name, major_id, cohort } = req.body;
    try {
        await db.query('UPDATE classes SET name = ?, major_id = ?, cohort = ? WHERE id = ?', [name, major_id, cohort, id]);
        res.json({ success: true, message: 'Cập nhật lớp học thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật lớp học.' });
    }
});

/**
 * Xóa Lớp học
 */
router.delete('/classes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM classes WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa lớp học thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa lớp học.' });
    }
});



/**
 * Quản lý bài viết (Posts)
 */
router.get('/posts', async (req, res) => {
    try {
        const [posts] = await db.query(`
            SELECT p.*, u.email, s.full_name, g.name as group_name 
            FROM posts p 
            JOIN users u ON p.user_id = u.id
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN groups_table g ON p.group_id = g.id
            ORDER BY p.created_at DESC
        `);
        res.json({ success: true, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách bài viết.' });
    }
});

router.delete('/posts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM posts WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa bài viết thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa bài viết.' });
    }
});

/**
 * Quản lý Tài liệu (Documents)
 */
router.get('/documents', async (req, res) => {
    try {
        const [documents] = await db.query(`
            SELECT d.*, s.name as subject_name, u.email as uploader_email
            FROM documents d
            JOIN subjects s ON d.subject_id = s.id
            LEFT JOIN users u ON d.uploader_id = u.id
            ORDER BY d.created_at DESC
        `);
        res.json({ success: true, data: documents });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách tài liệu.' });
    }
});

router.post('/documents', upload.single('file'), async (req, res) => {
    const { title, subject_id, uploader_id } = req.body;
    let file_url = '';
    let file_type = 'file';

    if (req.file) {
        file_url = `/uploads/${req.file.filename}`;
        file_type = path.extname(req.file.originalname).substring(1); 
    }

    try {
        await db.query(
            'INSERT INTO documents (title, subject_id, uploader_id, file_url, file_type) VALUES (?, ?, ?, ?, ?)',
            [title, subject_id, uploader_id || null, file_url, file_type]
        );
        res.json({ success: true, message: 'Đăng tài liệu thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi đăng tài liệu: ' + error.message });
    }
});

router.delete('/documents/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM documents WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa tài liệu thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa tài liệu.' });
    }
});

/**
 * Quản lý Lịch thi (Schedules / Exams)
 */
router.get('/exams', async (req, res) => {
    try {
        const [exams] = await db.query(`
            SELECT s.*, sub.name as subject_name, 
                   GROUP_CONCAT(u.email SEPARATOR ', ') as teacher_email,
                   GROUP_CONCAT(u.id SEPARATOR ',') as teacher_ids
            FROM schedules s
            JOIN subjects sub ON s.subject_id = sub.id
            LEFT JOIN schedule_teachers st ON s.id = st.schedule_id
            LEFT JOIN users u ON st.teacher_id = u.id
            WHERE s.schedule_type = 'exam'
            GROUP BY s.id
            ORDER BY s.schedule_date DESC
        `);
        res.json({ success: true, data: exams });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách lịch thi: ' + error.message });
    }
});

router.post('/exams', async (req, res) => {
    const { subject_id, teacher_ids, room_name, schedule_date, start_time, end_time } = req.body;
    try {
        const firstTeacherId = Array.isArray(teacher_ids) && teacher_ids.length > 0 ? teacher_ids[0] : null;

        const [result] = await db.query(`
            INSERT INTO schedules (subject_id, teacher_id, room_name, schedule_type, schedule_date, start_time, end_time) 
            VALUES (?, ?, ?, 'exam', ?, ?, ?)
        `, [subject_id, firstTeacherId, room_name, schedule_date, start_time, end_time]);
        
        const scheduleId = result.insertId;

        if (Array.isArray(teacher_ids) && teacher_ids.length > 0) {
            const values = teacher_ids.map(tId => [scheduleId, tId]);
            await db.query('INSERT IGNORE INTO schedule_teachers (schedule_id, teacher_id) VALUES ?', [values]);
        }

        res.json({ success: true, message: 'Tạo lịch thi mới thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tạo lịch thi: ' + error.message });
    }
});

router.put('/exams/:id', async (req, res) => {
    const { id } = req.params;
    const { subject_id, teacher_ids, room_name, schedule_date, start_time, end_time } = req.body;
    try {
        const firstTeacherId = Array.isArray(teacher_ids) && teacher_ids.length > 0 ? teacher_ids[0] : null;

        await db.query(`
            UPDATE schedules 
            SET subject_id = ?, teacher_id = ?, room_name = ?, schedule_date = ?, start_time = ?, end_time = ?
            WHERE id = ? AND schedule_type = 'exam'
        `, [subject_id, firstTeacherId, room_name, schedule_date, start_time, end_time, id]);

        await db.query('DELETE FROM schedule_teachers WHERE schedule_id = ?', [id]);

        if (Array.isArray(teacher_ids) && teacher_ids.length > 0) {
            const values = teacher_ids.map(tId => [id, tId]);
            await db.query('INSERT IGNORE INTO schedule_teachers (schedule_id, teacher_id) VALUES ?', [values]);
        }

        res.json({ success: true, message: 'Cập nhật lịch thi thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật lịch thi: ' + error.message });
    }
});

router.delete('/exams/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM schedules WHERE id = ? AND schedule_type = 'exam'", [id]);
        res.json({ success: true, message: 'Xóa lịch thi thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa lịch thi.' });
    }
});

/**
 * Quản lý Lịch học (Schedules / Theory & Practice)
 */
router.get('/schedules', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*, sub.name as subject_name, 
                   GROUP_CONCAT(u.email SEPARATOR ', ') as teacher_email,
                   GROUP_CONCAT(u.id SEPARATOR ',') as teacher_ids
            FROM schedules s
            JOIN subjects sub ON s.subject_id = sub.id
            LEFT JOIN schedule_teachers st ON s.id = st.schedule_id
            LEFT JOIN users u ON st.teacher_id = u.id
            WHERE s.schedule_type != 'exam'
            GROUP BY s.id
            ORDER BY s.schedule_date DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách lịch học: ' + error.message });
    }
});

router.post('/schedules', async (req, res) => {
    const { subject_id, teacher_ids, room_name, schedule_date, start_time, end_time, schedule_type } = req.body;
    try {
        const firstTeacherId = Array.isArray(teacher_ids) && teacher_ids.length > 0 ? teacher_ids[0] : null;

        const [result] = await db.query(`
            INSERT INTO schedules (subject_id, teacher_id, room_name, schedule_type, schedule_date, start_time, end_time) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [subject_id, firstTeacherId, room_name, schedule_type || 'theory', schedule_date, start_time, end_time]);
        
        const scheduleId = result.insertId;

        if (Array.isArray(teacher_ids) && teacher_ids.length > 0) {
            const values = teacher_ids.map(tId => [scheduleId, tId]);
            await db.query('INSERT IGNORE INTO schedule_teachers (schedule_id, teacher_id) VALUES ?', [values]);
        }

        res.json({ success: true, message: 'Tạo lịch học mới thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tạo lịch học: ' + error.message });
    }
});

router.put('/schedules/:id', async (req, res) => {
    const { id } = req.params;
    const { subject_id, teacher_ids, room_name, schedule_date, start_time, end_time, schedule_type } = req.body;
    try {
        const firstTeacherId = Array.isArray(teacher_ids) && teacher_ids.length > 0 ? teacher_ids[0] : null;

        await db.query(`
            UPDATE schedules 
            SET subject_id = ?, teacher_id = ?, room_name = ?, schedule_type = ?, schedule_date = ?, start_time = ?, end_time = ?
            WHERE id = ? AND schedule_type != 'exam'
        `, [subject_id, firstTeacherId, room_name, schedule_type || 'theory', schedule_date, start_time, end_time, id]);

        await db.query('DELETE FROM schedule_teachers WHERE schedule_id = ?', [id]);

        if (Array.isArray(teacher_ids) && teacher_ids.length > 0) {
            const values = teacher_ids.map(tId => [id, tId]);
            await db.query('INSERT IGNORE INTO schedule_teachers (schedule_id, teacher_id) VALUES ?', [values]);
        }

        res.json({ success: true, message: 'Cập nhật lịch học thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật lịch học: ' + error.message });
    }
});

router.delete('/schedules/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM schedules WHERE id = ? AND schedule_type != 'exam'", [id]);
        res.json({ success: true, message: 'Xóa lịch học thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa lịch học.' });
    }
});

/**
 * Quản lý Thông báo (Notifications)
 */
router.get('/notifications', async (req, res) => {
    try {
        const [notifications] = await db.query(`
            SELECT n.*, u.email as user_email 
            FROM notifications n
            JOIN users u ON n.user_id = u.id
            ORDER BY n.created_at DESC
        `);
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách thông báo.' });
    }
});

router.delete('/notifications/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM notifications WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa thông báo thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa thông báo.' });
    }
});

/**
 * Gửi thông báo toàn hệ thống
 */
router.post('/notifications/broadcast', async (req, res) => {
    const { title, message } = req.body;
    try {
        const [users] = await db.query('SELECT id FROM users WHERE status = "active"');
        const tasks = users.map(u => 
            db.query('INSERT INTO notifications (user_id, type, title, content) VALUES (?, "system", ?, ?)', [u.id, title, message])
        );
        await Promise.all(tasks);
        res.json({ success: true, message: `Đã gửi thông báo cho ${users.length} người dùng.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi gửi thông báo: ' + error.message });
    }
});

/**
 * Cập nhật Ngành học
 */
router.put('/majors/:id', async (req, res) => {
    const { id } = req.params;
    const { code, name } = req.body;
    try {
        await db.query('UPDATE majors SET code = ?, name = ? WHERE id = ?', [code, name, id]);
        res.json({ success: true, message: 'Cập nhật ngành học thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật ngành học.' });
    }
});

/**
 * QUẢN LÝ ĐIỂM SỐ (GRADES)
 * Dùng cho cả Admin và Giáo viên
 */

// Lấy danh sách đăng ký học của một môn/kỳ
router.get('/enrollments', async (req, res) => {
    const { subject_id, semester_id, class_id } = req.query;
    try {
        let query = `
            SELECT se.id as enrollment_id, s.user_id, s.full_name, s.student_code, 
                   sub.name as subject_name, sem.name as semester_name,
                   g.attendance_score, g.midterm_score, g.final_score, g.overall_score
            FROM student_enrollments se
            JOIN students s ON se.student_id = s.user_id
            JOIN subjects sub ON se.subject_id = sub.id
            JOIN semesters sem ON se.semester_id = sem.id
            LEFT JOIN grades g ON se.id = g.enrollment_id
            WHERE 1=1
        `;
        const params = [];
        if (subject_id) {
            query += ' AND se.subject_id = ?';
            params.push(subject_id);
        }
        if (semester_id) {
            query += ' AND se.semester_id = ?';
            params.push(semester_id);
        }
        if (class_id) {
            query += ' AND s.class_id = ?';
            params.push(class_id);
        }

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đăng ký: ' + error.message });
    }
});

// Cập nhật điểm cho một sinh viên (enrollment)
router.put('/grades', async (req, res) => {
    const { enrollment_id, attendance_score, midterm_score, final_score } = req.body;
    
    if (!enrollment_id) return res.status(400).json({ success: false, message: 'Thiếu enrollment_id' });

    try {
        // Tính điểm tổng kết (giả định: 10% chuyên cần, 30% giữa kỳ, 60% cuối kỳ)
        let overall = null;
        if (attendance_score !== null && midterm_score !== null && final_score !== null) {
            overall = (parseFloat(attendance_score) * 0.1) + 
                      (parseFloat(midterm_score) * 0.3) + 
                      (parseFloat(final_score) * 0.6);
            overall = Math.round(overall * 10) / 10; // Làm tròn 1 chữ số
        }

        // Kiểm tra xem đã có bản ghi điểm chưa
        const [exists] = await db.query('SELECT id FROM grades WHERE enrollment_id = ?', [enrollment_id]);

        if (exists.length > 0) {
            await db.query(`
                UPDATE grades 
                SET attendance_score = ?, midterm_score = ?, final_score = ?, overall_score = ?
                WHERE enrollment_id = ?
            `, [attendance_score, midterm_score, final_score, overall, enrollment_id]);
        } else {
            await db.query(`
                INSERT INTO grades (enrollment_id, attendance_score, midterm_score, final_score, overall_score)
                VALUES (?, ?, ?, ?, ?)
            `, [enrollment_id, attendance_score, midterm_score, final_score, overall]);
        }

        // Tự động cập nhật trạng thái trong student_enrollments nếu đã có điểm tổng kết
        if (overall !== null) {
            const status = overall >= 4.0 ? 'passed' : 'failed';
            await db.query('UPDATE student_enrollments SET status = ? WHERE id = ?', [status, enrollment_id]);
        }

        res.json({ success: true, message: 'Cập nhật điểm thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật điểm: ' + error.message });
    }
});

// Lấy danh sách Học kỳ
router.get('/semesters', async (req, res) => {
    try {
        const [semesters] = await db.query('SELECT * FROM semesters ORDER BY start_date DESC');
        res.json({ success: true, data: semesters });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách học kỳ.' });
    }
});

module.exports = router;
