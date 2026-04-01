const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * Danh sách Bài viết cho Feed (Tất cả hoặc theo nhóm)
 */
router.get('/posts', async (req, res) => {
    const { group_id } = req.query;
    try {
        let query = `
            SELECT p.*, u.email, s.full_name, g.name as group_name 
            FROM posts p 
            JOIN users u ON p.user_id = u.id
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN groups_table g ON p.group_id = g.id
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
 * Đăng bài viết mới
 */
router.post('/posts', async (req, res) => {
    const { user_id, group_id, content } = req.body;
    if (!user_id || !content) return res.status(400).json({ success: false, message: 'Thiếu thông tin Đăng bài' });
    
    try {
        await db.query(
            'INSERT INTO posts (user_id, group_id, content) VALUES (?, ?, ?)',
            [user_id, group_id || null, content]
        );
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

module.exports = router;
