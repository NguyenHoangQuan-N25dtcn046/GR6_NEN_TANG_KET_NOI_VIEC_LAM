-- MySQL 8.0+; database schema for MVP
CREATE DATABASE IF NOT EXISTS job_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE job_platform;
CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL, role ENUM('candidate','employer','admin') NOT NULL,
 is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
