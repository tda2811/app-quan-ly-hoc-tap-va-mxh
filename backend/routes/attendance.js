const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requestIp = require('request-ip');
const ipRangeCheck = require('ip-range-check');

// Danh sách dải IP hợp lệ của WiFi trường (Lấy mẫu từ TECH_NOTE)
const SCHOOL_IP_RANGES = [
    '192.168.1.0/24', 
    '10.0.0.0/16',
    '127.0.0.1' // cho localhost test
];

/**
 * Lấy lịch dạy của Giáo Viên 
 */
router.get('/schedules', async (req, res) => {
    const { teacher_id } = req.query;
    if (!teacher_id) return res.status(400).json({ success: false, message: 'Thiếu teacher_id' });
    try {
        const [schedules] = await db.query(`
            SELECT s.*, sub.name as subject_name 
            FROM schedules s 
            JOIN subjects sub ON s.subject_id = sub.id 
            WHERE s.teacher_id = ?
            ORDER BY s.schedule_date DESC
        `, [teacher_id]);
        res.json({ success: true, data: schedules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Lấy danh sách Sinh viên đã điểm danh trong một lịch học
 */
router.get('/list/:scheduleId', async (req, res) => {
    const { scheduleId } = req.params;
    try {
        const [attendees] = await db.query(`
            SELECT a.*, st.full_name, u.email 
            FROM attendances a 
            JOIN students st ON a.student_id = st.user_id 
            JOIN users u ON st.user_id = u.id 
            WHERE a.schedule_id = ?
            ORDER BY a.scanned_at DESC
        `, [scheduleId]);
        res.json({ success: true, data: attendees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Sinh Viên Điểm Danh (Quét QR) - CHECK IP
 */
router.post('/check-in', async (req, res) => {
    const { schedule_id, student_id } = req.body;

    if (!schedule_id || !student_id) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin điểm danh.' });
    }

    try {
        // 1. Lấy IP để Check
        const clientIp = requestIp.getClientIp(req); 
        const isInsideSchool = ipRangeCheck(clientIp, SCHOOL_IP_RANGES);

        // fallback test: Chấp nhận dải 192.168
        if (!isInsideSchool && !clientIp.startsWith('192.168')) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn phải kết nối WiFi của trường (chung dải IP) để thực hiện điểm danh!' 
            });
        }

        // 2. Kiểm tra xem đã điểm danh chưa
        const [exists] = await db.query('SELECT id FROM attendances WHERE schedule_id = ? AND student_id = ?', [schedule_id, student_id]);
        if (exists.length > 0) {
            return res.status(400).json({ success: false, message: 'Bạn đã điểm danh lịch học này rồi.' });
        }

        // 3. Tiến hành Lưu Điểm Danh
        await db.query(
            'INSERT INTO attendances (schedule_id, student_id, status, scanned_at, network_ip) VALUES (?, ?, "present", NOW(), ?)',
            [schedule_id, student_id, clientIp]
        );

        res.json({ success: true, message: 'Điểm danh thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
