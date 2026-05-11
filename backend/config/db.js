const mysql = require('mysql2');
require('dotenv').config();

// Tạo connection pool thay vì connection đơn lẻ để tối ưu hiệu suất (Kết nối với DB mình vừa thiết kế)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',        // Tài khoản MySQL của bạn, thường mặc định là root
    password: process.env.DB_PASSWORD || '',    // Điền pass MySQL của bạn vào file .env
    database: process.env.DB_NAME || 'student_lms_social',
    waitForConnections: true,
    connectionLimit: 10,  // Số luồng kết nối đồng thời tối đa
    queueLimit: 0
});

// Trả về dạng promise để dùng async / await phía Controller cho dễ
const promisePool = pool.promise();


// Chạy khởi tạo bảng cần thiết (VD bảng schedule_teachers bị thiếu trong schema)
async function initTables() {
    try {
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS schedule_teachers (
                schedule_id INT NOT NULL,
                teacher_id VARCHAR(36) NOT NULL,
                PRIMARY KEY (schedule_id, teacher_id),
                FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Database init: Table schedule_teachers check OK.');
    } catch (err) {
        console.error('❌ Database init Error:', err.message);
    }

    try {
        const [cols] = await promisePool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schedules' AND COLUMN_NAME = 'semester_id'`
        );
        if (cols.length === 0) {
            await promisePool.query(`
                ALTER TABLE schedules
                ADD COLUMN semester_id INT NULL,
                ADD INDEX idx_schedules_semester (semester_id),
                ADD CONSTRAINT fk_schedules_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL
            `);
            console.log('✅ Migration: schedules.semester_id added.');
        }
    } catch (err) {
        console.error('❌ Migration schedules.semester_id:', err.message);
    }
}
initTables();

module.exports = promisePool;
