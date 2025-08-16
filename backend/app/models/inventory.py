from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class InventoryData(Base):
    __tablename__ = "inventory_data"
    
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(String(50), nullable=False, index=True)
    sku_id = Column(String(100), nullable=False, index=True)
    current_stock = Column(Integer, nullable=False)
    safety_stock = Column(Integer, nullable=False)
    reorder_point = Column(Integer, nullable=False)
    recommended_order_qty = Column(Integer, nullable=False)
    lead_time_days = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=True)
    status = Column(String(20), nullable=False)  # urgent, low, optimal, excess
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    class Config:
        orm_mode = True
