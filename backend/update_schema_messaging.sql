-- Add new columns to claims table
ALTER TABLE claims ADD COLUMN claimer_id INT;
ALTER TABLE claims ADD COLUMN finder_id INT;
ALTER TABLE claims ADD COLUMN handover_code VARCHAR(10);
ALTER TABLE claims MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected', 'active', 'identity_requested', 'identity_submitted', 'handover_initiated', 'returned', 'rejected') DEFAULT 'active';

-- Migrate existing data (if any)
UPDATE claims SET claimer_id = user_id;
-- For finder_id, we need to join with items table, but for now let's just make it nullable and handle it in application logic or manual fix if needed. 
-- Actually, better to try update it.
UPDATE claims c JOIN items i ON c.item_id = i.id SET c.finder_id = i.user_id;

-- Now make columns NOT NULL where appropriate
-- ALTER TABLE claims MODIFY COLUMN claimer_id INT NOT NULL; -- Might fail if table empty? No.
-- ALTER TABLE claims MODIFY COLUMN finder_id INT NOT NULL;

-- Add foreign keys
ALTER TABLE claims ADD FOREIGN KEY (claimer_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE claims ADD FOREIGN KEY (finder_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update messages table
ALTER TABLE messages ADD COLUMN claim_id INT;
ALTER TABLE messages ADD COLUMN message_type ENUM('text', 'system', 'identity_form', 'identity_response', 'handover_init', 'handover_confirm') DEFAULT 'text';
ALTER TABLE messages ADD FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE;

-- Create identity_verifications table
CREATE TABLE IF NOT EXISTS identity_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    claim_id INT NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    place_found VARCHAR(255),
    date_of_loss DATE,
    location_of_loss VARCHAR(255),
    unlock_description TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);
