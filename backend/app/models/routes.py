from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class RouteData(Base):
    __tablename__ = "route_data"
    
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(String(100), nullable=False, unique=True, index=True)
    warehouse_id = Column(String(50), nullable=False, index=True)
    total_distance = Column(Float, nullable=False)
    estimated_time = Column(Float, nullable=False)  # in minutes
    estimated_cost = Column(Float, nullable=False)
    efficiency_score = Column(Float, nullable=False)
    status = Column(String(20), default="planned")  # planned, in_progress, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to delivery stops
    stops = relationship("DeliveryStop", back_populates="route", cascade="all, delete-orphan")
    
    class Config:
        orm_mode = True


class DeliveryStop(Base):
    __tablename__ = "delivery_stops"
    
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(String(100), ForeignKey("route_data.route_id"), nullable=False)
    stop_id = Column(String(100), nullable=False, index=True)
    client_id = Column(String(100), nullable=False, index=True)
    customer_name = Column(String(200), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    demand_qty = Column(Integer, nullable=False)
    estimated_arrival = Column(DateTime, nullable=False)
    order = Column(Integer, nullable=False)
    status = Column(String(20), default="pending")  # pending, in_transit, delivered
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to route
    route = relationship("RouteData", back_populates="stops")
    
    class Config:
        orm_mode = True
