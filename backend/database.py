import mysql.connector
from mysql.connector import pooling
import config  # loads .env automatically

db_config = {
    "host": config.DB_HOST,
    "user": config.DB_USER,
    "password": config.DB_PASSWORD,
    "database": config.DB_NAME,
    "port": config.DB_PORT,
}

# Create a connection pool: warm connections ready for instant queries (e.g. Aiven)
try:
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="findit_pool",
        pool_size=10,  # Handle dashboard spikes
        pool_reset_session=True,  # Clean slate per request without full re-login overhead
        **db_config
    )
    print("Database connection pool created successfully")
except mysql.connector.Error as err:
    print(f"Error creating connection pool: {err}")
    connection_pool = None


def get_db_connection():
    """
    Get a connection from the pool. Pre-pings so only alive connections are used;
    try/finally ensures connection.close() so the pool doesn't exhaust.
    Use as a FastAPI dependency: db=Depends(get_db_connection).
    """
    if not connection_pool:
        raise Exception("Database connection pool is not initialized")
    connection = connection_pool.get_connection()
    try:
        # Ensure connection is alive before use (reconnect if needed) — warm, instant queries
        connection.ping(reconnect=True)
        yield connection
    finally:
        connection.close()
