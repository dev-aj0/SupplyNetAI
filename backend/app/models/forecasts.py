from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class ForecastData(Base):
    __tablename__ = "forecast_data"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    warehouse_id = Column(String(50), nullable=False, index=True)
    sku_id = Column(String(100), nullable=False, index=True)
    predicted_demand = Column(Float, nullable=False)
    confidence_lower = Column(Float, nullable=False)
    confidence_upper = Column(Float, nullable=False)
    actual_demand = Column(Float, nullable=True)
    model_version = Column(String(50), nullable=True)
    accuracy_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    class Config:
        orm_mode = True
