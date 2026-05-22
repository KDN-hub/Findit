import config
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = (
    f"mysql+pymysql://{config.DB_USER}:{config.DB_PASSWORD}"
    f"@{config.DB_HOST}:{config.DB_PORT}/{config.DB_NAME}"
)

import os
from pathlib import Path

# Try to find the exact absolute path to ca.pem
_ca_path = config.AIVEN_SSL_CA_PATH
if not os.path.isabs(_ca_path):
    # Try relative to the project root or the backend folder
    _possible_paths = [
        Path.cwd() / _ca_path,
        Path(__file__).parent.parent / _ca_path,
        Path(__file__).parent / "certs" / "ca.pem",
    ]
    for p in _possible_paths:
        if p.exists():
            _ca_path = str(p)
            break

# Aiven requires SSL — PyMySQL uses a nested 'ssl' dictionary
connect_args = {
    "ssl": {
        "ca": _ca_path
    }
}

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=280,  # Recycle before Aiven's 5-minute timeout drops it
    pool_pre_ping=False,  # REMOVE the 0.75s ping latency on EVERY request!
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_connection():
    connection = engine.raw_connection()
    try:
        yield connection
    finally:
        connection.close()
