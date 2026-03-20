const express = require('express');
const router = express.Router();
const db = require('../config/db');

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
            SELECT u.id, u.email, u.role, u.status, s.full_name, s.student_code 
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
 * Gửi thông báo toàn trường
 */
router.post('/notifications/broadcast', async (req, res) => {
    const { title, message } = req.body;
    try {
        // Lấy tất cả user ID
        const [users] = await db.query('SELECT id FROM users');
        const insertPromises = users.map(u => 
            db.query('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [u.id, title, message])
        );
        await Promise.all(insertPromises);
        res.json({ success: true, message: 'Đã gửi thông báo đến toàn bộ người dùng.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi gửi thông báo.' });
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
            SELECT s.*, sub.name as subject_name, u.email as teacher_email
            FROM schedules s
            JOIN subjects sub ON s.subject_id = sub.id
            LEFT JOIN users u ON s.teacher_id = u.id
            WHERE s.schedule_type = 'exam'
            ORDER BY s.schedule_date DESC
        `);
        res.json({ success: true, data: exams });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách lịch thi.' });
    }
});

router.post('/exams', async (req, res) => {
    const { subject_id, teacher_id, room_name, schedule_date, start_time, end_time } = req.body;
    try {
        await db.query(`
            INSERT INTO schedules (subject_id, teacher_id, room_name, schedule_type, schedule_date, start_time, end_time) 
            VALUES (?, ?, ?, 'exam', ?, ?, ?)
        `, [subject_id, teacher_id || null, room_name, schedule_date, start_time, end_time]);
        res.json({ success: true, message: 'Tạo lịch thi mới thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tạo lịch thi.' });
    }
});

router.put('/exams/:id', async (req, res) => {
    const { id } = req.params;
    const { subject_id, teacher_id, room_name, schedule_date, start_time, end_time } = req.body;
    try {
        await db.query(`
            UPDATE schedules 
            SET subject_id = ?, teacher_id = ?, room_name = ?, schedule_date = ?, start_time = ?, end_time = ?
            WHERE id = ? AND schedule_type = 'exam'
        `, [subject_id, teacher_id || null, room_name, schedule_date, start_time, end_time, id]);
        res.json({ success: true, message: 'Cập nhật lịch thi thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật lịch thi.' });
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

module.exports = router;
