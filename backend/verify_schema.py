import pymysql
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
        conn = pymysql.connect(**db_config)
        cursor = conn.cursor()
        
        print("Checking tables:")
        tables = ["audit_logs", "claims", "conversations", "items", "messages", "users", "webauthn_credentials"]
        for t in tables:
            print(f"- {t}")
            
        print("\nChecking 'users' columns:")
        cursor.execute("DESCRIBE users")
        for row in cursor.fetchall():
            print(f"  {row['Field']} {row['Type']}")

        print("\nChecking 'messages' columns:")
        cursor.execute("DESCRIBE messages")
        for col in cursor.fetchall():
            print(f"  {col['Field']} {col['Type']}")

        cursor.close()
        conn.close()
    except pymysql.Error as err:
        print(f"Error: {err}")

if __name__ == "__main__":
    main()
