"""
reset_db.py - Drops and recreates the users and items tables to apply schema changes.
WARNING: This will DELETE all existing data in both tables.
Usage: python reset_db.py
"""

import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "findit"),
    "port": int(os.getenv("DB_PORT", 3306)),
}

CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url VARCHAR(255),
    role ENUM('student', 'admin') DEFAULT 'student',
    auth_provider ENUM('google', 'email') DEFAULT 'email',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
"""

CREATE_ITEMS_TABLE = """
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Lost', 'Found', 'Recovered') NOT NULL DEFAULT 'Found',
    category VARCHAR(100),
    location VARCHAR(255),
    keywords VARCHAR(255),
    date_found DATE,
    contact_preference VARCHAR(50) DEFAULT 'in_app',
    image_url VARCHAR(500),
    user_id INT NOT NULL,
    verification_pin VARCHAR(4) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
"""

CREATE_MESSAGES_TABLE = """
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    item_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
)
"""

CREATE_CLAIMS_TABLE = """
CREATE TABLE IF NOT EXISTS claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    proof_description TEXT NOT NULL,
    proof_image_url VARCHAR(500),
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
)
"""


def main():
    print("Connecting to MySQL...")
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print(f"Connected to database '{db_config['database']}' successfully!")

        # Drop tables (messages first, then items, then users due to FK dependencies)
        print("\nDropping 'messages' table...")
        cursor.execute("DROP TABLE IF EXISTS messages")
        print("  Table dropped.")

        print("Dropping 'items' table...")
        cursor.execute("DROP TABLE IF EXISTS items")
        print("  Table dropped.")

        print("Dropping 'users' table...")
        cursor.execute("DROP TABLE IF EXISTS users")
        print("  Table dropped.")

        # Recreate tables (users first, then items, then messages)
        print("\nRecreating 'users' table...")
        cursor.execute(CREATE_USERS_TABLE)
        conn.commit()
        print("  Table created successfully!")

        print("Recreating 'items' table...")
        cursor.execute(CREATE_ITEMS_TABLE)
        conn.commit()
        print("  Table created successfully!")

        print("Recreating 'messages' table...")
        cursor.execute(CREATE_MESSAGES_TABLE)
        conn.commit()
        print("  Table created successfully!")

        print("Recreating 'claims' table...")
        cursor.execute(CREATE_CLAIMS_TABLE)
        conn.commit()
        print("  Table created successfully!")

        # Verify users table
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        print(f"\nColumns in 'users' table:")
        for col in columns:
            print(f"  - {col[0]} ({col[1]})")

        # Verify items table
        cursor.execute("DESCRIBE items")
        columns = cursor.fetchall()
        print(f"\nColumns in 'items' table:")
        for col in columns:
            print(f"  - {col[0]} ({col[1]})")

        # Verify messages table
        cursor.execute("DESCRIBE messages")
        columns = cursor.fetchall()
        print(f"\nColumns in 'messages' table:")
        for col in columns:
            print(f"  - {col[0]} ({col[1]})")

        # Verify claims table
        cursor.execute("DESCRIBE claims")
        columns = cursor.fetchall()
        print(f"\nColumns in 'claims' table:")
        for col in columns:
            print(f"  - {col[0]} ({col[1]})")

        cursor.close()
        conn.close()
        print("\nDone! Database has been reset.")
    except mysql.connector.Error as err:
        print(f"\nError: {err}")
        print("\nTroubleshooting:")
        print("  1. Make sure XAMPP MySQL is running")
        print("  2. Make sure the 'findit' database exists in phpMyAdmin")
        print("  3. Check your .env file credentials")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
