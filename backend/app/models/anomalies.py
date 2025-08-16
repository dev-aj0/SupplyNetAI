from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class AnomalyData(Base):
    __tablename__ = "anomaly_data"
    
    id = Column(Integer, primary_key=True, index=True)
    anomaly_id = Column(String(100), nullable=False, unique=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    warehouse_id = Column(String(50), nullable=False, index=True)
    sku_id = Column(String(100), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # spike, drop, unusual_pattern
    severity = Column(String(20), nullable=False)  # low, medium, high
    description = Column(Text, nullable=False)
    impact_percentage = Column(Float, nullable=False)
    suggested_action = Column(Text, nullable=False)
    status = Column(String(20), default="open")  # open, investigating, resolved
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    class Config:
        orm_mode = True
