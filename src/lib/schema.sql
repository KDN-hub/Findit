-- Findit Database Schema for MySQL
-- Run this script to initialize the database

CREATE DATABASE IF NOT EXISTS findit;
USE findit;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    location ENUM('On Campus', 'Off Campus') NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Items table (Lost/Found items)
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    finder_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    category ENUM('Electronics', 'ID Cards', 'Books', 'Clothing', 'Accessories', 'Keys', 'Documents', 'Other') NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    photo_url VARCHAR(500),
    status ENUM('Lost', 'Found', 'Claimed') NOT NULL DEFAULT 'Found',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (finder_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_location (location),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_search (title, description)
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    item_id VARCHAR(36) NOT NULL,
    claimant_id VARCHAR(36) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    proof_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (claimant_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_claim (item_id, claimant_id),
    INDEX idx_status (status)
);

-- Messages table (for secure internal messaging)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    claim_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    receiver_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_claim_id (claim_id),
    INDEX idx_receiver_unread (receiver_id, is_read)
);
