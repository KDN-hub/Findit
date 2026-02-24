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
    print("Connecting to MySQL...")
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print(f"Connected to database '{db_config['database']}' successfully!")

        with open("update_schema_messaging.sql", "r") as f:
            sql_script = f.read()

        statements = sql_script.split(';')
        for statement in statements:
            if statement.strip():
                try:
                    cursor.execute(statement)
                    print(f"Executed: {statement[:50]}...")
                except mysql.connector.Error as err:
                    print(f"Error executing statement: {err}")
                    # Continue even if error (e.g., column already exists)
                    pass

        conn.commit()
        print("\nMigration completed successfully!")

        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"\nError: {err}")
        raise SystemExit(1)

if __name__ == "__main__":
    main()
