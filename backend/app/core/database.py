from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Create engine
if settings.database_url.startswith("sqlite"):
    # For development/testing, use SQLite
    engine = create_engine(
        "sqlite:///./supplynet.db",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # For production, use PostgreSQL
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_recycle=300,
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Metadata for migrations
metadata = MetaData()


async def init_db():
    """Initialize database tables"""
    try:
        # Import models to ensure they're registered
        from app.models import sales, inventory, forecasts, routes, anomalies
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def close_db():
    """Close database connections"""
    engine.dispose()
    logger.info("Database connections closed")
