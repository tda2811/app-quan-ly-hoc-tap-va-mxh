
CREATE DATABASE IF NOT EXISTS student_lms_social
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE student_lms_social;

-- Danh mục Khoa/Ngành (CNTT, KT, ...)
CREATE TABLE majors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,      -- VD: 'IT', 'MKT'
    name VARCHAR(255) NOT NULL             
);

-- Danh mục Lớp học - link trực tiếp với khoa
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    major_id INT,
    cohort INT,                            -- Khóa (VD: 2022, 2023)
    FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE SET NULL
);

-- Account login - Bảng này chỉ chứa info đăng nhập thôi
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,            -- UUID: gen tự động từ Backend
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') NOT NULL,
    status ENUM('active', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Hồ sơ chi tiết SV (Tách riêng để dễ scale sau này)
CREATE TABLE students (
    user_id VARCHAR(36) PRIMARY KEY,       -- Map 1-1 với bảng users
    student_code VARCHAR(50) UNIQUE NOT NULL, 
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    class_id INT,
    cohort INT,
    major_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE SET NULL
);


-- Danh sách Môn học
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    credit INT NOT NULL                    
);

-- Quản lý Học kỳ (Dùng cho filter điểm và lịch học)
CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,            -- 'Kỳ 1 - 2024'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- SV đăng ký môn học (Bảng pivot chính)
CREATE TABLE student_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    subject_id INT NOT NULL,
    semester_id INT NOT NULL,
    status ENUM('studying', 'passed', 'failed') DEFAULT 'studying',
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    UNIQUE KEY(student_id, subject_id, semester_id) -- Tránh đăng ký trùng môn trong 1 kỳ
);

-- Schedule: Lịch học/thi chi tiết hàng ngày
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    teacher_id VARCHAR(36), 
    room_name VARCHAR(100) NOT NULL,
    schedule_type ENUM('theory', 'practice', 'exam') NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Điểm danh (Chống gian lận bằng IP nội bộ)
CREATE TABLE attendances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    scanned_at TIMESTAMP NULL,             
    network_ip VARCHAR(50) NULL,           -- Dev note: Check dải IP trường để tránh điểm danh hộ
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    UNIQUE KEY(schedule_id, student_id)
);

-- Quản lý điểm - 1 enrollment có 1 bộ điểm
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL UNIQUE,     
    attendance_score FLOAT DEFAULT NULL,   
    midterm_score FLOAT DEFAULT NULL,      
    final_score FLOAT DEFAULT NULL,        
    overall_score FLOAT DEFAULT NULL,      
    FOREIGN KEY (enrollment_id) REFERENCES student_enrollments(id) ON DELETE CASCADE
);

-- Tài liệu học tập (Hiện tại đang để tạm, có thể bỏ nếu dùng drive)
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    uploader_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,        -- pdf, pptx, zip...
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL
);


-- Hội nhóm (Lớp, CLB, hoặc nhóm tự tạo)
CREATE TABLE groups_table ( 
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    group_type ENUM('class_group', 'cohort_group', 'custom_group') NOT NULL,
    cover_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thành viên của group
CREATE TABLE group_members (
    group_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups_table(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- News Feed: Bài viết của SV/Giáo viên
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    group_id INT NULL,                     -- Null = Post lên tường cá nhân
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,             -- Cache count để load feed cho nhanh
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups_table(id) ON DELETE CASCADE
);

-- Ảnh/Video đính kèm bài viết
CREATE TABLE post_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    media_type ENUM('image', 'video', 'file') NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Bình luận bài viết
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Hệ thống Like (Dùng chung cho Post và Comment)
CREATE TABLE likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    target_type ENUM('post', 'comment') NOT NULL,
    target_id INT NOT NULL,                
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY(target_type, target_id, user_id)
);

-- Hội thoại Chat (1-1 hoặc Group)
CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('private', 'group') NOT NULL,
    name VARCHAR(255) NULL,                -- Private chat thì để null
    last_message_at TIMESTAMP NULL,        -- Optimize: Sắp xếp danh sách chat mới nhất
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ai đang tham gia chat nào?
CREATE TABLE conversation_participants (
    conversation_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Nội dung tin nhắn cụ thể
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id VARCHAR(36),
    content TEXT,
    message_type ENUM('text', 'image', 'file') DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);


-- Lịch sử thông báo push về App
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('schedule_reminder', 'grade_updated', 'post_like', 'system', 'smart_suggestion') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_data JSON,                      -- Chứa Deep Link để app mobile biết mở màn hình nào
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- INDEXING: Tối ưu hiệu năng cho các bảng hay query
-- ---------------------------------------------------------
CREATE INDEX idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX idx_schedules_date ON schedules(schedule_date);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_group_id ON posts(group_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_likes_target ON likes(target_type, target_id);

