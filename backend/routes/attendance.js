const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requestIp = require('request-ip');
const ipRangeCheck = require('ip-range-check');

const SCHOOL_IP_RANGES = [
    '192.168.1.0/24',
    '10.0.0.0/16',
    '127.0.0.1' //localhost test
];

/**
 * Lấy lịch dạy của Giáo Viên 
 */

router.get('/schedules', async (req, res) => {
    const { teacher_id } = req.query;
    if (!teacher_id) return res.status(400).json({ success: false, message: 'Thiếu teacher_id' });
    try {
        const [schedules] = await db.query(`
            SELECT s.*, sub.name as subject_name, sem.name as semester_name
            FROM schedules s 
            JOIN subjects sub ON s.subject_id = sub.id 
            LEFT JOIN semesters sem ON s.semester_id = sem.id
            WHERE s.teacher_id = ?
            ORDER BY s.schedule_date DESC, s.start_time DESC, s.id DESC
        `, [teacher_id]);
        res.json({ success: true, data: schedules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Giáo viên tự thêm lịch dạy
 */
router.post('/schedules', async (req, res) => {
    const { teacher_id, subject_id, room_name, schedule_date, start_time, end_time, schedule_type, semester_id } = req.body;
    if (!teacher_id || !subject_id || !schedule_date) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc.' });
    }
    const semId = semester_id != null && semester_id !== '' ? parseInt(String(semester_id), 10) : NaN;
    if (!semId || Number.isNaN(semId)) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn học kỳ.' });
    }
    try {
        const [[semRow]] = await db.query('SELECT id FROM semesters WHERE id = ?', [semId]);
        if (!semRow) {
            return res.status(400).json({ success: false, message: 'Học kỳ không hợp lệ.' });
        }
        const [result] = await db.query(`
            INSERT INTO schedules (teacher_id, subject_id, semester_id, room_name, schedule_date, start_time, end_time, schedule_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [teacher_id, subject_id, semId, room_name, schedule_date, start_time, end_time, schedule_type || 'theory']);

        // Đồng bộ vào bảng schedule_teachers
        await db.query('INSERT IGNORE INTO schedule_teachers (schedule_id, teacher_id) VALUES (?, ?)', [result.insertId, teacher_id]);

        res.json({ success: true, data: { id: result.insertId }, message: 'Thêm lịch dạy thành công.' });
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

        // 4. Đồng bộ enrollments theo buổi học
        const [[schedule]] = await db.query(
            'SELECT subject_id, schedule_date, semester_id FROM schedules WHERE id = ?',
            [schedule_id]
        );

        if (schedule?.subject_id && schedule?.schedule_date) {
            let semesterId = schedule.semester_id;

            if (!semesterId) {
                let [[semester]] = await db.query(
                    'SELECT id FROM semesters WHERE ? BETWEEN start_date AND end_date ORDER BY start_date DESC LIMIT 1',
                    [schedule.schedule_date]
                );
                if (!semester?.id) {
                    [[semester]] = await db.query('SELECT id FROM semesters ORDER BY start_date DESC LIMIT 1');
                }
                if (!semester?.id) {
                    const [insertSem] = await db.query(
                        `INSERT INTO semesters (name, start_date, end_date)
                         VALUES ('Học kỳ mặc định', '2000-01-01', '2099-12-31')`
                    );
                    semester = { id: insertSem.insertId };
                }
                semesterId = semester.id;
            }

            await db.query(
                `INSERT IGNORE INTO student_enrollments (student_id, subject_id, semester_id, status)
                 VALUES (?, ?, ?, 'studying')`,
                [student_id, schedule.subject_id, semesterId]
            );
        }

        res.json({ success: true, message: 'Điểm danh thành công!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Bạn đã điểm danh lịch học này rồi.' });
        }
        console.error('Lỗi điểm danh:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi điểm danh.' });
    }
});

/**
 * Cập nhật lịch dạy (Giáo viên tự sửa)
 */
router.put('/schedules/:id', async (req, res) => {
    const { id } = req.params;
    const { teacher_id, subject_id, room_name, schedule_date, start_time, end_time, schedule_type, semester_id } = req.body;
    const semId = semester_id != null && semester_id !== '' ? parseInt(String(semester_id), 10) : NaN;
    if (!semId || Number.isNaN(semId)) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn học kỳ.' });
    }
    try {
        const [[semRow]] = await db.query('SELECT id FROM semesters WHERE id = ?', [semId]);
        if (!semRow) {
            return res.status(400).json({ success: false, message: 'Học kỳ không hợp lệ.' });
        }
        await db.query(`
            UPDATE schedules 
            SET subject_id = ?, semester_id = ?, room_name = ?, schedule_date = ?, start_time = ?, end_time = ?, schedule_type = ? 
            WHERE id = ? AND teacher_id = ?
        `, [subject_id, semId, room_name, schedule_date, start_time, end_time, schedule_type, id, teacher_id]);
        res.json({ success: true, message: 'Cập nhật lịch dạy thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Xóa lịch dạy
 */
router.delete('/schedules/:id', async (req, res) => {
    const { id } = req.params;
    const { teacher_id } = req.query;
    try {
        await db.query('DELETE FROM schedules WHERE id = ? AND teacher_id = ?', [id, teacher_id]);
        res.json({ success: true, message: 'Đã xóa lịch dạy.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
