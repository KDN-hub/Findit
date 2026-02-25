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

# Create a connection pool (larger size for dashboard spikes)
try:
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="findit_pool",
        pool_size=10,  # Increased from 5 to handle dashboard spikes
        pool_reset_session=True,
        **db_config
    )
    print("Database connection pool created successfully")
except mysql.connector.Error as err:
    print(f"Error creating connection pool: {err}")
    connection_pool = None


def get_db_connection():
    """
    Get a connection from the pool. Uses try/finally so the connection is
    always returned to the pool via connection.close() — prevents PoolError: pool exhausted.
    Use as a FastAPI dependency: db=Depends(get_db_connection).
    """
    if not connection_pool:
        raise Exception("Database connection pool is not initialized")
    connection = connection_pool.get_connection()
    try:
        yield connection
    finally:
        connection.close()
