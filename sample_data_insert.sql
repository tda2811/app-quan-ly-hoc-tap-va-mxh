-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for student_lms_social
CREATE DATABASE IF NOT EXISTS `student_lms_social` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `student_lms_social`;

-- Dumping structure for table student_lms_social.attendances
CREATE TABLE IF NOT EXISTS `attendances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `schedule_id` int NOT NULL,
  `student_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('present','absent','late') COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanned_at` timestamp NULL DEFAULT NULL,
  `network_ip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `schedule_id` (`schedule_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `attendances_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendances_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.attendances: ~5 rows (approximately)
REPLACE INTO `attendances` (`id`, `schedule_id`, `student_id`, `status`, `scanned_at`, `network_ip`) VALUES
	(2, 2, 'user-uuid-student-001', 'present', '2026-04-08 07:22:46', '192.168.1.6'),
	(3, 2, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'present', '2026-04-08 07:25:16', '192.168.1.6'),
	(5, 1, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'present', '2026-04-08 07:25:54', '192.168.1.6'),
	(6, 4, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'present', '2026-04-08 07:38:39', '192.168.1.6'),
	(9, 6, 'user-uuid-student-001', 'present', '2026-04-13 04:02:03', '192.168.1.35');

-- Dumping structure for table student_lms_social.badges
CREATE TABLE IF NOT EXISTS `badges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.badges: ~0 rows (approximately)

-- Dumping structure for table student_lms_social.classes
CREATE TABLE IF NOT EXISTS `classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `major_id` int DEFAULT NULL,
  `cohort` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `major_id` (`major_id`),
  CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`major_id`) REFERENCES `majors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.classes: ~4 rows (approximately)
REPLACE INTO `classes` (`id`, `name`, `major_id`, `cohort`) VALUES
	(1, '62TH1', 1, 62),
	(2, '62TH2', 1, 62),
	(3, '61KT1', 2, 61),
	(4, '60NA2', 3, 60),
	(5, 'Đối ngoại nhân dân', 5, 18);

-- Dumping structure for table student_lms_social.comments
CREATE TABLE IF NOT EXISTS `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.comments: ~3 rows (approximately)
REPLACE INTO `comments` (`id`, `post_id`, `user_id`, `content`, `created_at`) VALUES
	(1, 3, 'user-uuid-student-001', 'bình luận test', '2026-04-08 06:53:10'),
	(2, 4, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'sinh qua', '2026-04-08 07:29:07'),
	(3, 4, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'xinh quá', '2026-04-08 07:37:22'),
	(4, 5, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'trét đăng bài', '2026-04-08 07:37:45');

-- Dumping structure for table student_lms_social.conversations
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('private','group') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.conversations: ~3 rows (approximately)
REPLACE INTO `conversations` (`id`, `type`, `name`, `last_message_at`, `created_at`) VALUES
	(1, 'private', NULL, '2026-04-08 07:37:54', '2026-03-20 08:24:05'),
	(2, 'private', NULL, '2026-04-08 05:14:50', '2026-04-08 04:39:24'),
	(3, 'private', NULL, '2026-04-08 07:36:53', '2026-04-08 07:36:49');

-- Dumping structure for table student_lms_social.conversation_participants
CREATE TABLE IF NOT EXISTS `conversation_participants` (
  `conversation_id` int NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `conversation_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversation_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.conversation_participants: ~6 rows (approximately)
REPLACE INTO `conversation_participants` (`conversation_id`, `user_id`, `joined_at`) VALUES
	(1, '539e2c1a-2044-426b-9573-ace4b87f14ca', '2026-03-20 08:24:05'),
	(1, 'user-uuid-admin-001', '2026-03-20 08:24:05'),
	(2, 'user-uuid-admin-001', '2026-04-08 04:39:24'),
	(2, 'user-uuid-student-001', '2026-04-08 04:39:24'),
	(3, 'user-uuid-admin-001', '2026-04-08 07:36:49'),
	(3, 'user-uuid-teacher-001', '2026-04-08 07:36:49');

-- Dumping structure for table student_lms_social.documents
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` int NOT NULL,
  `uploader_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subject_id` (`subject_id`),
  KEY `uploader_id` (`uploader_id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.documents: ~1 rows (approximately)
REPLACE INTO `documents` (`id`, `subject_id`, `uploader_id`, `title`, `file_url`, `file_type`, `created_at`) VALUES
	(2, 2, 'user-uuid-admin-001', 'vshss', '/uploads/1775631937836-IMG4804.HEIC', 'HEIC', '2026-04-08 07:05:38'),
	(3, 3, 'user-uuid-admin-001', 'hgghh', '/uploads/1775633744859-IMG4950.HEIC', 'HEIC', '2026-04-08 07:35:45');

-- Dumping structure for table student_lms_social.gamification_points
CREATE TABLE IF NOT EXISTS `gamification_points` (
  `student_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_points` int DEFAULT '0',
  `ranking_tier` enum('Bronze','Silver','Gold','Platinum','Diamond') COLLATE utf8mb4_unicode_ci DEFAULT 'Bronze',
  PRIMARY KEY (`student_id`),
  CONSTRAINT `gamification_points_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.gamification_points: ~0 rows (approximately)

-- Dumping structure for table student_lms_social.grades
CREATE TABLE IF NOT EXISTS `grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `enrollment_id` int NOT NULL,
  `attendance_score` float DEFAULT NULL,
  `midterm_score` float DEFAULT NULL,
  `final_score` float DEFAULT NULL,
  `overall_score` float DEFAULT NULL,
  `letter_grade` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gpa_score` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollment_id` (`enrollment_id`),
  CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `student_enrollments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.grades: ~0 rows (approximately)

-- Dumping structure for table student_lms_social.groups_table
CREATE TABLE IF NOT EXISTS `groups_table` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_type` enum('class_group','cohort_group','custom_group') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.groups_table: ~3 rows (approximately)
REPLACE INTO `groups_table` (`id`, `name`, `group_type`, `cover_url`, `created_at`) VALUES
	(1, 'Câu lạc bộ IT1', 'custom_group', NULL, '2026-03-17 12:32:58'),
	(2, 'gghgg', 'custom_group', NULL, '2026-04-14 07:43:52'),
	(3, 'shbsbbsnbdf', 'cohort_group', NULL, '2026-04-14 07:48:23');

-- Dumping structure for table student_lms_social.group_members
CREATE TABLE IF NOT EXISTS `group_members` (
  `group_id` int NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','member') COLLATE utf8mb4_unicode_ci DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups_table` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.group_members: ~3 rows (approximately)
REPLACE INTO `group_members` (`group_id`, `user_id`, `role`, `joined_at`) VALUES
	(1, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'member', '2026-04-08 07:29:43'),
	(1, 'user-uuid-student-001', 'member', '2026-03-17 12:37:00'),
	(1, 'user-uuid-teacher-001', 'member', '2026-03-17 12:39:34'),
	(2, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'member', '2026-04-19 04:30:37');

-- Dumping structure for table student_lms_social.likes
CREATE TABLE IF NOT EXISTS `likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `target_type` enum('post','comment') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` int NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `target_type` (`target_type`,`target_id`,`user_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_likes_target` (`target_type`,`target_id`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.likes: ~4 rows (approximately)
REPLACE INTO `likes` (`id`, `target_type`, `target_id`, `user_id`, `created_at`) VALUES
	(4, 'post', 3, 'user-uuid-student-001', '2026-04-08 06:53:16'),
	(5, 'post', 4, 'user-uuid-student-001', '2026-04-08 07:12:23'),
	(8, 'post', 4, '539e2c1a-2044-426b-9573-ace4b87f14ca', '2026-04-08 07:37:29'),
	(9, 'post', 5, '539e2c1a-2044-426b-9573-ace4b87f14ca', '2026-04-08 07:37:39'),
	(13, 'post', 6, 'user-uuid-student-001', '2026-04-14 07:48:47'),
	(14, 'post', 7, '539e2c1a-2044-426b-9573-ace4b87f14ca', '2026-04-19 04:32:13');

-- Dumping structure for table student_lms_social.majors
CREATE TABLE IF NOT EXISTS `majors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.majors: ~4 rows (approximately)
REPLACE INTO `majors` (`id`, `code`, `name`) VALUES
	(1, 'CNTT', 'Công nghệ thông tin'),
	(2, 'KT', 'Kinh tế đầu tư'),
	(3, 'NNA', 'Ngôn ngữ Anh'),
	(4, 'QTKD', 'Quản trị kinh doanh'),
	(5, 'ĐN', 'Đối Ngoại');

-- Dumping structure for table student_lms_social.messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `sender_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `message_type` enum('text','image','file') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `idx_messages_conversation_id` (`conversation_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.messages: ~11 rows (approximately)
REPLACE INTO `messages` (`id`, `conversation_id`, `sender_id`, `content`, `message_type`, `created_at`) VALUES
	(1, 1, 'user-uuid-admin-001', 'xin chào', 'text', '2026-03-20 08:24:11'),
	(2, 1, 'user-uuid-admin-001', 'hello', 'text', '2026-03-20 08:24:57'),
	(3, 1, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'hiuhi', 'text', '2026-03-20 08:25:11'),
	(4, 1, 'user-uuid-admin-001', 'cìnbd', 'text', '2026-03-23 03:25:06'),
	(5, 2, 'user-uuid-admin-001', 'chào an', 'text', '2026-04-08 04:39:28'),
	(6, 2, 'user-uuid-admin-001', 'gdgshdf', 'text', '2026-04-08 04:54:18'),
	(7, 2, 'user-uuid-student-001', 'chào', 'text', '2026-04-08 04:55:23'),
	(8, 1, 'user-uuid-admin-001', 'híbhss', 'text', '2026-04-08 05:13:07'),
	(9, 2, 'user-uuid-admin-001', 'shnxjdnd', 'text', '2026-04-08 05:13:14'),
	(10, 2, 'user-uuid-student-001', 'fjsgxd', 'text', '2026-04-08 05:14:50'),
	(11, 3, 'user-uuid-admin-001', 'chjavs', 'text', '2026-04-08 07:36:53'),
	(12, 1, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'hdjacaf', 'text', '2026-04-08 07:37:54');

-- Dumping structure for table student_lms_social.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('schedule_reminder','grade_updated','post_like','system','smart_suggestion') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `action_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.notifications: ~8 rows (approximately)
REPLACE INTO `notifications` (`id`, `user_id`, `type`, `title`, `content`, `is_read`, `action_data`, `created_at`) VALUES
	(1, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'system', 'thông báo từ admin test', 'thông báo từ admin test', 0, NULL, '2026-04-14 07:13:26'),
	(2, 'user-uuid-admin-001', 'system', 'thông báo từ admin test', 'thông báo từ admin test', 0, NULL, '2026-04-14 07:13:26'),
	(3, 'user-uuid-student-001', 'system', 'thông báo từ admin test', 'thông báo từ admin test', 0, NULL, '2026-04-14 07:13:26'),
	(4, 'user-uuid-student-002', 'system', 'thông báo từ admin test', 'thông báo từ admin test', 0, NULL, '2026-04-14 07:13:26'),
	(5, 'user-uuid-teacher-001', 'system', 'thông báo từ admin test', 'thông báo từ admin test', 0, NULL, '2026-04-14 07:13:26'),
	(6, '539e2c1a-2044-426b-9573-ace4b87f14ca', 'system', 'thông báo từ admin test2', 'thông báo từ admin test2', 0, NULL, '2026-04-14 07:14:31'),
	(7, 'user-uuid-admin-001', 'system', 'thông báo từ admin test2', 'thông báo từ admin test2', 0, NULL, '2026-04-14 07:14:31'),
	(8, 'user-uuid-student-001', 'system', 'thông báo từ admin test2', 'thông báo từ admin test2', 0, NULL, '2026-04-14 07:14:31'),
	(9, 'user-uuid-teacher-001', 'system', 'thông báo từ admin test2', 'thông báo từ admin test2', 0, NULL, '2026-04-14 07:14:31'),
	(10, 'user-uuid-student-002', 'system', 'thông báo từ admin test2', 'thông báo từ admin test2', 0, NULL, '2026-04-14 07:14:31');

-- Dumping structure for table student_lms_social.posts
CREATE TABLE IF NOT EXISTS `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_id` int DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `likes_count` int DEFAULT '0',
  `comments_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_posts_created_at` (`created_at`),
  KEY `idx_posts_group_id` (`group_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `groups_table` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.posts: ~6 rows (approximately)
REPLACE INTO `posts` (`id`, `user_id`, `group_id`, `content`, `likes_count`, `comments_count`, `created_at`, `updated_at`) VALUES
	(2, 'user-uuid-teacher-001', NULL, 'Thầy đã upload tài liệu môn OOP lên group rồi nhé các em.', 12, 1, '2026-03-13 08:01:18', '2026-04-08 06:53:15'),
	(3, '539e2c1a-2044-426b-9573-ace4b87f14ca', NULL, 'tôi là sinh viên ducnt ', 1, 1, '2026-03-23 03:27:04', '2026-04-08 06:53:16'),
	(4, 'user-uuid-student-001', NULL, 'bsnsna', 2, 2, '2026-04-08 07:12:19', '2026-04-08 07:37:29'),
	(5, '539e2c1a-2044-426b-9573-ace4b87f14ca', 1, 'dvbasv', 1, 1, '2026-04-08 07:37:38', '2026-04-08 07:37:45'),
	(6, '539e2c1a-2044-426b-9573-ace4b87f14ca', 1, 'djagx', 1, 0, '2026-04-08 07:53:35', '2026-04-14 07:48:47'),
	(7, '539e2c1a-2044-426b-9573-ace4b87f14ca', 2, 'trtrtr', 1, 0, '2026-04-19 04:31:27', '2026-04-19 04:32:13');

-- Dumping structure for table student_lms_social.post_media
CREATE TABLE IF NOT EXISTS `post_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `media_type` enum('image','video','file') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  CONSTRAINT `post_media_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.post_media: ~2 rows (approximately)
REPLACE INTO `post_media` (`id`, `post_id`, `media_url`, `media_type`) VALUES
	(1, 4, '/uploads/1775632339795-IMG4804.HEIC', 'image'),
	(2, 6, '/uploads/1775634815676-IMG4954.HEIC', 'image');

-- Dumping structure for table student_lms_social.reminders
CREATE TABLE IF NOT EXISTS `reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remind_at` timestamp NOT NULL,
  `status` enum('pending','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `reminders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.reminders: ~0 rows (approximately)

-- Dumping structure for table student_lms_social.schedules
CREATE TABLE IF NOT EXISTS `schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` int NOT NULL,
  `teacher_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `schedule_type` enum('theory','practice','exam') COLLATE utf8mb4_unicode_ci NOT NULL,
  `schedule_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  PRIMARY KEY (`id`),
  KEY `subject_id` (`subject_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `idx_schedules_date` (`schedule_date`),
  CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.schedules: ~6 rows (approximately)
REPLACE INTO `schedules` (`id`, `subject_id`, `teacher_id`, `room_name`, `schedule_type`, `schedule_date`, `start_time`, `end_time`) VALUES
	(1, 1, 'user-uuid-teacher-001', 'P.402 Nhà C', 'theory', '2024-03-20', '07:30:00', '10:00:00'),
	(2, 2, 'user-uuid-teacher-001', 'Lab 201 Nhà D', 'practice', '2024-03-21', '13:30:00', '16:00:00'),
	(3, 2, 'user-uuid-teacher-001', '403', 'exam', '2026-04-08', '11:42:44', '11:42:44'),
	(4, 2, 'user-uuid-teacher-001', '406', 'practice', '2026-04-08', '14:35:51', '14:35:51'),
	(5, 3, 'user-uuid-teacher-001', 'hga', 'theory', '2026-04-13', '11:00:00', '22:00:00'),
	(6, 1, 'user-uuid-teacher-001', 'ouhb', 'practice', '2026-04-13', '11:00:00', '17:00:00');

-- Dumping structure for table student_lms_social.schedule_teachers
CREATE TABLE IF NOT EXISTS `schedule_teachers` (
  `schedule_id` int NOT NULL,
  `teacher_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`schedule_id`,`teacher_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `schedule_teachers_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedule_teachers_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.schedule_teachers: ~6 rows (approximately)
REPLACE INTO `schedule_teachers` (`schedule_id`, `teacher_id`) VALUES
	(1, 'user-uuid-teacher-001'),
	(2, 'user-uuid-teacher-001'),
	(3, 'user-uuid-teacher-001'),
	(4, 'user-uuid-teacher-001'),
	(5, 'user-uuid-teacher-001'),
	(6, 'user-uuid-teacher-001');

-- Dumping structure for table student_lms_social.semesters
CREATE TABLE IF NOT EXISTS `semesters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.semesters: ~2 rows (approximately)
REPLACE INTO `semesters` (`id`, `name`, `start_date`, `end_date`) VALUES
	(1, 'Học kỳ 1 - Năm 2024', '2024-09-05', '2025-01-20'),
	(2, 'Học kỳ 2 - Năm 2024', '2025-02-10', '2025-06-30');

-- Dumping structure for table student_lms_social.students
CREATE TABLE IF NOT EXISTS `students` (
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `class_id` int DEFAULT NULL,
  `cohort` int DEFAULT NULL,
  `major_id` int DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `student_code` (`student_code`),
  KEY `class_id` (`class_id`),
  KEY `major_id` (`major_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_3` FOREIGN KEY (`major_id`) REFERENCES `majors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.students: ~2 rows (approximately)
REPLACE INTO `students` (`user_id`, `student_code`, `full_name`, `avatar_url`, `bio`, `class_id`, `cohort`, `major_id`) VALUES
	('539e2c1a-2044-426b-9573-ace4b87f14ca', '123456', '123456', NULL, NULL, NULL, NULL, NULL),
	('user-uuid-student-001', 'SV001', 'Nguyễn Văn An', NULL, NULL, 1, 62, 1),
	('user-uuid-student-002', 'SV002', 'Trần Thị Bình', NULL, NULL, 1, 62, 1);

-- Dumping structure for table student_lms_social.student_badges
CREATE TABLE IF NOT EXISTS `student_badges` (
  `student_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `badge_id` int NOT NULL,
  `earned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`,`badge_id`),
  KEY `badge_id` (`badge_id`),
  CONSTRAINT `student_badges_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `student_badges_ibfk_2` FOREIGN KEY (`badge_id`) REFERENCES `badges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.student_badges: ~0 rows (approximately)

-- Dumping structure for table student_lms_social.student_enrollments
CREATE TABLE IF NOT EXISTS `student_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_id` int NOT NULL,
  `semester_id` int NOT NULL,
  `status` enum('studying','passed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'studying',
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`,`subject_id`,`semester_id`),
  KEY `subject_id` (`subject_id`),
  KEY `semester_id` (`semester_id`),
  KEY `idx_student_enrollments_student` (`student_id`),
  CONSTRAINT `student_enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `student_enrollments_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_enrollments_ibfk_3` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.student_enrollments: ~3 rows (approximately)
REPLACE INTO `student_enrollments` (`id`, `student_id`, `subject_id`, `semester_id`, `status`) VALUES
	(1, 'user-uuid-student-001', 1, 1, 'studying'),
	(2, 'user-uuid-student-001', 2, 1, 'studying'),
	(3, 'user-uuid-student-002', 1, 1, 'studying');

-- Dumping structure for table student_lms_social.subjects
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credit` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subject_code` (`subject_code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.subjects: ~3 rows (approximately)
REPLACE INTO `subjects` (`id`, `subject_code`, `name`, `credit`) VALUES
	(1, 'BAS001', 'Lập trình hướng đối tượng', 3),
	(2, 'BAS002', 'Cấu trúc dữ liệu và giải thuật', 4),
	(3, 'ECO001', 'Kinh tế vĩ mô', 3);

-- Dumping structure for table student_lms_social.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('student','teacher','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','banned') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table student_lms_social.users: ~4 rows (approximately)
REPLACE INTO `users` (`id`, `email`, `password_hash`, `role`, `status`, `created_at`, `updated_at`) VALUES
	('539e2c1a-2044-426b-9573-ace4b87f14ca', 'duc@gmail.com', '$2b$10$s2pe2iw2U.s7BMiChLASbOyfXtkXwrO3lKiF9g8odTD2c/3IcgWry', 'student', 'active', '2026-03-20 01:09:42', '2026-03-20 01:09:42'),
	('user-uuid-admin-001', 'admin@edu.vn', '$2b$10$DlggGXn6gCoVjW1/iPD6aOULA4G1/lqjV.wvLtut6s1Ncxg0UwbqS', 'admin', 'active', '2026-03-13 08:01:18', '2026-03-20 08:11:28'),
	('user-uuid-student-001', 'sinhvien.an@student.vn', '$2b$10$DlggGXn6gCoVjW1/iPD6aOULA4G1/lqjV.wvLtut6s1Ncxg0UwbqS', 'student', 'active', '2026-03-13 08:01:18', '2026-03-13 08:22:27'),
	('user-uuid-student-002', 'sinhvien.binh@student.vn', '$2b$10$DlggGXn6gCoVjW1/iPD6aOULA4G1/lqjV.wvLtut6s1Ncxg0UwbqS', 'student', 'active', '2026-03-13 08:01:18', '2026-03-13 08:22:29'),
	('user-uuid-teacher-001', 'giangvien.nam@educonnect.vn', '$2b$10$DlggGXn6gCoVjW1/iPD6aOULA4G1/lqjV.wvLtut6s1Ncxg0UwbqS', 'teacher', 'active', '2026-03-13 08:01:18', '2026-03-13 08:22:34');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
