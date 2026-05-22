USE findit;

CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    finder_id INT NOT NULL,
    claimer_id INT NOT NULL,
    finder_code VARCHAR(10) DEFAULT NULL,
    claimer_code VARCHAR(10) DEFAULT NULL,
    finder_code_created_at DATETIME DEFAULT NULL,
    claimer_code_created_at DATETIME DEFAULT NULL,
    finder_verified BOOLEAN DEFAULT FALSE,
    claimer_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (finder_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (claimer_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_conversation (item_id, claimer_id)
);
