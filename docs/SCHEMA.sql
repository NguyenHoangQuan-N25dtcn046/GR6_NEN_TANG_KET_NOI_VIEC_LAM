-- MySQL 8.0+; database schema for MVP
CREATE DATABASE IF NOT EXISTS job_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE job_platform;
CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL, role ENUM('candidate','employer','admin') NOT NULL,
 is_active BOOLEAN NOT NULL DEFAULT TRUE, auth_version INT NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS candidate_profiles (
 id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE,
 full_name VARCHAR(150) NOT NULL, phone VARCHAR(20), skills TEXT, cv_url VARCHAR(500),
 FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS employer_profiles (
 id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE,
 company_name VARCHAR(200) NOT NULL, company_website VARCHAR(255), description TEXT,
 FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS job_categories (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS jobs (
 id INT AUTO_INCREMENT PRIMARY KEY, employer_id INT NOT NULL, category_id INT,
 title VARCHAR(200) NOT NULL, description TEXT NOT NULL, location VARCHAR(200) NOT NULL,
 salary_min DECIMAL(14,2), salary_max DECIMAL(14,2),
 status ENUM('pending','published','rejected','closed') NOT NULL DEFAULT 'pending', deadline DATE,
 approval VARCHAR(20) NOT NULL DEFAULT 'pending', job_status VARCHAR(20) NOT NULL DEFAULT 'open',
 rejection_reason TEXT, work_mode VARCHAR(20), job_type VARCHAR(20), experience_years INT,
 FOREIGN KEY(employer_id) REFERENCES employer_profiles(id), FOREIGN KEY(category_id) REFERENCES job_categories(id),
 INDEX idx_jobs_status(status), INDEX idx_jobs_employer(employer_id),
 CONSTRAINT chk_salary_range CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);
CREATE TABLE IF NOT EXISTS applications (
 id INT AUTO_INCREMENT PRIMARY KEY, job_id INT NOT NULL, candidate_id INT NOT NULL,
 cv_url VARCHAR(500), cover_letter TEXT,
 status ENUM('submitted','reviewing','accepted','rejected') NOT NULL DEFAULT 'submitted',
 applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(job_id) REFERENCES jobs(id), FOREIGN KEY(candidate_id) REFERENCES candidate_profiles(id),
 CONSTRAINT uq_application_job_candidate UNIQUE(job_id,candidate_id)
);
CREATE TABLE IF NOT EXISTS candidate_experiences (
 id INT AUTO_INCREMENT PRIMARY KEY, candidate_id INT NOT NULL,
 company VARCHAR(200) NOT NULL, position VARCHAR(200) NOT NULL,
 start_date DATE NOT NULL, end_date DATE, description TEXT,
 FOREIGN KEY(candidate_id) REFERENCES candidate_profiles(id)
);
CREATE TABLE IF NOT EXISTS candidate_educations (
 id INT AUTO_INCREMENT PRIMARY KEY, candidate_id INT NOT NULL,
 school VARCHAR(200) NOT NULL, major VARCHAR(200) NOT NULL, degree VARCHAR(100) NOT NULL,
 start_date DATE NOT NULL, end_date DATE,
 FOREIGN KEY(candidate_id) REFERENCES candidate_profiles(id)
);
CREATE TABLE IF NOT EXISTS saved_jobs (
 candidate_id INT NOT NULL, job_id INT NOT NULL, saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(candidate_id, job_id),
 FOREIGN KEY(candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
 FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS revoked_tokens (
 id INT AUTO_INCREMENT PRIMARY KEY, jti VARCHAR(255) NOT NULL UNIQUE, user_id INT NOT NULL,
 revoke_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, expires_at DATETIME NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id)
);
