-- Puchuku Database Schema - Profiles Update
-- Run this SQL on your MySQL server to add profile support.

USE puchuku_db;

-- 1. Create Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    is_kids BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- 2. Modify My List table to support profiles
-- First, add the column allowing NULLs initially
ALTER TABLE my_list ADD COLUMN profile_id INT DEFAULT NULL AFTER user_id;

-- Add foreign key constraint
ALTER TABLE my_list ADD CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Migration (Optional/Safety): 
-- If you have existing data in my_list, you might want to create a default profile 
-- for each user and link their existing list items to it.
-- These steps depend on your existing data.
