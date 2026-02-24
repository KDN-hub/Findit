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

SQL = """
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
);
"""

def main():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print("Connected to database.")
        cursor.execute(SQL)
        print("Table 'conversations' created successfully.")
        conn.commit()
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")

if __name__ == "__main__":
    main()
