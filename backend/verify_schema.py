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

def main():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print("Checking tables:")
        cursor.execute("SHOW TABLES")
        for (table,) in cursor.fetchall():
            print(f"- {table}")
            
        print("\nChecking 'claims' columns:")
        cursor.execute("DESCRIBE claims")
        for col in cursor.fetchall():
            print(f"  {col[0]} {col[1]}")

        print("\nChecking 'messages' columns:")
        cursor.execute("DESCRIBE messages")
        for col in cursor.fetchall():
            print(f"  {col[0]} {col[1]}")

        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")

if __name__ == "__main__":
    main()
