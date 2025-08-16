from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class SalesData(Base):
    __tablename__ = "sales_data"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    warehouse_id = Column(String(50), nullable=False, index=True)
    sku_id = Column(String(100), nullable=False, index=True)
    units_sold = Column(Integer, nullable=False)
    order_id = Column(String(100), nullable=True)
    client_id = Column(String(100), nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    class Config:
        orm_mode = True
