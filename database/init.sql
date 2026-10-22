CREATE DATABASE IF NOT EXISTS quizdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quizdb;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS quiz_sets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  set_name VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  display_name VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  set_id INT NOT NULL,
  question_text TEXT NOT NULL,
  correct_choice_id INT NULL,
  CONSTRAINT fk_questions_set FOREIGN KEY (set_id) REFERENCES quiz_sets(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS choices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  choice_text VARCHAR(500) NOT NULL,
  CONSTRAINT fk_choices_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attempts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  set_id INT NOT NULL,
  total_questions INT NOT NULL,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  submitted_at DATETIME NOT NULL,
  CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_attempt_set FOREIGN KEY (set_id) REFERENCES quiz_sets(id),
  INDEX idx_attempts_submitted (submitted_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attempt_answers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT NOT NULL,
  question_id INT NOT NULL,
  selected_choice_id INT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions(id),
  CONSTRAINT fk_answers_choice FOREIGN KEY (selected_choice_id) REFERENCES choices(id),
  INDEX idx_answers_attempt (attempt_id)
) ENGINE=InnoDB;

INSERT INTO quiz_sets (id, set_name) VALUES
(1, 'Đề 1 - Kiến thức công nghệ thông tin'),
(2, 'Đề 2 - Mạng và hệ thống')
ON DUPLICATE KEY UPDATE set_name=VALUES(set_name);

INSERT INTO questions (id, set_id, question_text) VALUES
(1,1,'Docker được dùng chủ yếu để làm gì?'),
(2,1,'MySQL là loại phần mềm nào?'),
(3,1,'Lệnh nào xem trạng thái dịch vụ Docker Compose?'),
(4,1,'Nginx thường được dùng làm gì trong kiến trúc này?'),
(5,1,'Prometheus chủ yếu dùng để làm gì?'),
(6,2,'HTTPS cung cấp lớp bảo vệ nào cho kết nối web?'),
(7,2,'Grafana dùng chủ yếu để làm gì?'),
(8,2,'Loki được dùng để quản lý loại dữ liệu nào?'),
(9,2,'Tệp .env thường dùng để làm gì?'),
(10,2,'Docker Compose quản lý điều gì?')
ON DUPLICATE KEY UPDATE question_text=VALUES(question_text);

INSERT INTO choices (id, question_id, choice_text) VALUES
(1,1,'Đóng gói và chạy ứng dụng trong container'),
(2,1,'Chỉ dùng để chỉnh sửa ảnh'),
(3,1,'Thay thế hệ điều hành Windows'),
(4,1,'Chỉ dùng để tạo tài liệu'),
(5,2,'Hệ quản trị cơ sở dữ liệu quan hệ'),
(6,2,'Trình duyệt web'),
(7,2,'Trình biên dịch Java'),
(8,2,'Phần mềm chỉnh sửa video'),
(9,3,'docker compose ps'),
(10,3,'docker image paint'),
(11,3,'git compose start'),
(12,3,'mysql compose show'),
(13,4,'Reverse proxy và định tuyến HTTP/HTTPS'),
(14,4,'Chỉ lưu dữ liệu SQL'),
(15,4,'Thay thế Prometheus'),
(16,4,'Chỉ biên dịch JavaScript'),
(17,5,'Thu thập và lưu trữ metrics'),
(18,5,'Lưu ảnh người dùng'),
(19,5,'Quản lý mật khẩu trình duyệt'),
(20,5,'Soạn thảo văn bản'),
(21,6,'Mã hóa và xác thực máy chủ khi cấu hình đúng'),
(22,6,'Tăng dung lượng ổ cứng'),
(23,6,'Xóa cơ sở dữ liệu'),
(24,6,'Nén tất cả ảnh'),
(25,7,'Tạo dashboard trực quan hóa dữ liệu'),
(26,7,'Chạy câu lệnh SQL thay MySQL'),
(27,7,'Build container'),
(28,7,'Tạo chứng chỉ CA công cộng'),
(29,8,'Log'),
(30,8,'Ảnh bitmap'),
(31,8,'Tệp âm thanh'),
(32,8,'Bản trình chiếu'),
(33,9,'Lưu cấu hình và biến môi trường'),
(34,9,'Lưu mã nguồn kernel'),
(35,9,'Thay thế Dockerfile'),
(36,9,'Tạo người dùng Windows'),
(37,10,'Nhiều dịch vụ/container qua một cấu hình'),
(38,10,'Chỉ một bảng Excel'),
(39,10,'Chỉ email'),
(40,10,'Chỉ giao diện đồ họa')
ON DUPLICATE KEY UPDATE choice_text=VALUES(choice_text);

UPDATE questions SET correct_choice_id=1 WHERE id=1;
UPDATE questions SET correct_choice_id=5 WHERE id=2;
UPDATE questions SET correct_choice_id=9 WHERE id=3;
UPDATE questions SET correct_choice_id=13 WHERE id=4;
UPDATE questions SET correct_choice_id=17 WHERE id=5;
UPDATE questions SET correct_choice_id=21 WHERE id=6;
UPDATE questions SET correct_choice_id=25 WHERE id=7;
UPDATE questions SET correct_choice_id=29 WHERE id=8;
UPDATE questions SET correct_choice_id=33 WHERE id=9;
UPDATE questions SET correct_choice_id=37 WHERE id=10;
