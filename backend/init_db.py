"""
init_db.py - Run once to create all tables in the findit database.
Usage: python init_db.py
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

TABLES = [
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
]


def main():
    print("Connecting to MySQL...")
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print(f"Connected to database '{db_config['database']}' successfully!")

        for i, table_sql in enumerate(TABLES, 1):
            cursor.execute(table_sql)
            print(f"  Table {i}/{len(TABLES)} created (or already exists).")

        conn.commit()
        print("\nAll tables initialized successfully!")

        # Verify by listing tables
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
        print("  1. Make sure XAMPP MySQL is running")
        print("  2. Make sure the 'findit' database exists in phpMyAdmin")
        print("  3. Check your .env file credentials")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
