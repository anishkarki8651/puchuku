-- Puchuku Database Schema
-- Run this SQL on your MySQL server to create the required tables.

CREATE DATABASE IF NOT EXISTS puchuku_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE puchuku_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    google_id VARCHAR(255) DEFAULT NULL UNIQUE,
    auth_provider ENUM('local', 'google') DEFAULT 'local',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_google_id (google_id)
) ENGINE=InnoDB;

-- My List table
CREATE TABLE IF NOT EXISTS my_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tmdb_id INT NOT NULL,
    media_type ENUM('movie', 'tv') NOT NULL,
    title VARCHAR(255) NOT NULL,
    poster_path VARCHAR(500) DEFAULT NULL,
    vote_average DECIMAL(3,1) DEFAULT NULL,
    release_date VARCHAR(20) DEFAULT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_item (user_id, tmdb_id, media_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;
