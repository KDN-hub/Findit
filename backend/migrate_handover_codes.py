"""
Migration script to add handover codes to conversations table.
Run this script to update your database schema.
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def migrate():
    try:
        # Connect to database
        db = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "findit")
        )
        
        cursor = db.cursor()
        
        # Check if columns already exist
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'conversations' 
            AND COLUMN_NAME IN ('claimer_code', 'finder_code')
        """, (os.getenv("DB_NAME", "findit"),))
        
        existing = cursor.fetchall()
        existing_columns = [col[0] for col in existing]
        
        # Add columns if they don't exist
        if 'finder_code' not in existing_columns:
            cursor.execute("ALTER TABLE conversations ADD COLUMN finder_code VARCHAR(4) DEFAULT NULL")
            print("Added finder_code column")
        
        if 'claimer_code' not in existing_columns:
            cursor.execute("ALTER TABLE conversations ADD COLUMN claimer_code VARCHAR(4) DEFAULT NULL")
            print("Added claimer_code column")
        
        db.commit()
        print("Migration completed successfully!")
        
    except mysql.connector.Error as err:
        print(f"Migration error: {err}")
        db.rollback()
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    migrate()
