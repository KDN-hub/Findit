"""
init_db.py - Run once to create all required tables (e.g. findit or defaultdb).
Uses the same config as the app (config.py), so env vars from .env or Render work.
Usage: python init_db.py
"""

import mysql.connector
import config  # same env as the app (including DB_NAME e.g. defaultdb on Render)

db_config = {
    "host": config.DB_HOST,
    "user": config.DB_USER,
    "password": config.DB_PASSWORD,
    "database": config.DB_NAME,
    "port": config.DB_PORT,
}

# Order matters: users first, then tables that reference users, etc.
TABLES = [
    (
        "users",
        """
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
        """,
    ),
    (
        "items",
        """
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
        """,
    ),
    (
        "messages",
        """
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
        """,
    ),
    (
        "claims",
        """
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
        """,
    ),
    (
        "conversations",
        """
        CREATE TABLE IF NOT EXISTS conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_id INT NOT NULL,
            finder_id INT NOT NULL,
            claimer_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
            FOREIGN KEY (finder_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (claimer_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_conversation (item_id, claimer_id)
        )
        """,
    ),
]


def ensure_tables():
    """Create all tables if they don't exist. Safe to call at app startup (equivalent to Base.metadata.create_all)."""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        for _name, table_sql in TABLES:
            cursor.execute(table_sql)
        conn.commit()
        cursor.close()
        conn.close()
        print("[INIT] Tables ensured (create_all equivalent).")
    except Exception as e:
        print(f"[INIT] Warning: could not ensure tables: {e}")


def main():
    print("Connecting to MySQL...")
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print(f"Connected to database '{db_config['database']}' successfully!")

        for name, table_sql in TABLES:
            cursor.execute(table_sql)
            print(f"  Table '{name}' created (or already exists).")

        conn.commit()
        print("\nAll tables initialized successfully!")

        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"\nTables in '{db_config['database']}':")
        for (table_name,) in tables:
            print(f"  - {table_name}")

        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"\nError: {err}")
        print("\nTroubleshooting:")
        print("  1. Ensure MySQL is running and the database exists.")
        print("  2. For production (e.g. Render): set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT in env.")
        print("     (If your host uses 'defaultdb', set DB_NAME=defaultdb and run this script once.)")
        print("  3. Check your .env file or environment variables.")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
