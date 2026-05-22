import config
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = (
    f"mysql+mysqlconnector://{config.DB_USER}:{config.DB_PASSWORD}"
    f"@{config.DB_HOST}:{config.DB_PORT}/{config.DB_NAME}"
)

# Aiven requires SSL — uses their CA cert for identity verification
connect_args = {
    "ssl_verify_cert": True,
    "ssl_verify_identity": True,
    "ssl_ca": config.AIVEN_SSL_CA_PATH  # Path to the ca.pem Aiven gives you
}

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
    pool_pre_ping=True,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_connection():
    connection = engine.raw_connection()
    try:
        yield connection
    finally:
        connection.close()
