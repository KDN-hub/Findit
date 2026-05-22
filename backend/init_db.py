"""
init_db.py - Run once to create all required tables (e.g. findit or defaultdb).
Uses the same config as the app (config.py), so env vars from .env or Render work.
Usage: python init_db.py
"""

import pymysql
import config  # same env as the app (including DB_NAME e.g. defaultdb on Render)
import os
from pathlib import Path

# Resolve robust SSL CA path exactly like database.py
_ca_path = config.AIVEN_SSL_CA_PATH
if not os.path.isabs(_ca_path):
    _possible_paths = [
        Path.cwd() / _ca_path,
        Path(__file__).parent.parent / _ca_path,
        Path(__file__).parent / "certs" / "ca.pem",
    ]
    for p in _possible_paths:
        if p.exists():
            _ca_path = str(p)
            break

db_config = {
    "host": config.DB_HOST,
    "user": config.DB_USER,
    "password": config.DB_PASSWORD,
    "database": config.DB_NAME,
    "port": config.DB_PORT,
    "ssl": {"ca": _ca_path}
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
            role ENUM('student', 'staff', 'visitor', 'admin') DEFAULT 'student',
            auth_provider ENUM('google', 'email') DEFAULT 'email',
            matric_number VARCHAR(20) DEFAULT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            is_verified BOOLEAN DEFAULT FALSE,
            verification_code VARCHAR(10) DEFAULT NULL,
            verification_expires DATETIME DEFAULT NULL,
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
        )
        """,
    ),
    (
        "audit_logs",
        """
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            action VARCHAR(64) NOT NULL,
            item_id INT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
        )
        """,
    ),
    (
        "webauthn_credentials",
        """
        CREATE TABLE IF NOT EXISTS webauthn_credentials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            credential_id VARCHAR(512) NOT NULL UNIQUE,
            public_key TEXT NOT NULL,
            sign_count INT DEFAULT 0,
            transports VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """,
    ),
]


def ensure_tables():
    """Create all tables if they don't exist. Safe to call at app startup (equivalent to Base.metadata.create_all)."""
    try:
        conn = pymysql.connect(**db_config)
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
        conn = pymysql.connect(**db_config)
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
    except pymysql.Error as err:
        print(f"\nError: {err}")
        print("\nTroubleshooting:")
        print("  1. Ensure MySQL is running and the database exists.")
        print("  2. For production (e.g. Render): set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT in env.")
        print("     (If your host uses 'defaultdb', set DB_NAME=defaultdb and run this script once.)")
        print("  3. Check your .env file or environment variables.")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
