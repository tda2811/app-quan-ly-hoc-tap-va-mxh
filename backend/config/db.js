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
module.exports = pool.promise();
