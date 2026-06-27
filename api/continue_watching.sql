-- Continue Watching table migration
-- Run this SQL to add continue_watching table to your database

-- Create continue_watching table if not exists
CREATE TABLE IF NOT EXISTS continue_watching (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    profile_id INT NOT NULL,
    tmdb_id INT NOT NULL,
    media_type ENUM('movie', 'tv') NOT NULL,
    title VARCHAR(255) NOT NULL,
    poster_path VARCHAR(500) DEFAULT NULL,
    vote_average DECIMAL(3,1) DEFAULT NULL,
    release_date VARCHAR(20) DEFAULT NULL,
    season INT DEFAULT NULL,
    episode INT DEFAULT NULL,
    `cur_time` DECIMAL(10,2) DEFAULT 0,
    last_watched TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_profile_item (profile_id, tmdb_id, media_type),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id),
    INDEX idx_last_watched (last_watched)
) ENGINE=InnoDB;

-- If table already exists, add the cur_time column:
-- ALTER TABLE continue_watching ADD COLUMN `cur_time` DECIMAL(10,2) DEFAULT 0 AFTER episode;

-- Or rename existing column:
-- ALTER TABLE continue_watching CHANGE COLUMN `current_time` `cur_time` DECIMAL(10,2) DEFAULT 0;