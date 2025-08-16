from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DeliveryPoint(BaseModel):
    client_id: str = Field(..., min_length=1, max_length=100)
    customer_name: str = Field(..., min_length=1, max_length=200)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    demand_qty: int = Field(..., ge=0)


class WarehouseData(BaseModel):
    warehouse_id: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    capacity: Optional[int] = Field(None, ge=0)


class VehicleConstraints(BaseModel):
    capacity: int = Field(1000, ge=1, description="Vehicle capacity in units")
    max_time: int = Field(480, ge=1, description="Maximum route time in minutes")
    speed: float = Field(50.0, ge=1, description="Average speed in mph")
    service_time: int = Field(15, ge=0, description="Service time per stop in minutes")


class RouteOptimizationRequest(BaseModel):
    warehouse_data: WarehouseData
    delivery_points: List[DeliveryPoint]
    vehicle_constraints: Optional[VehicleConstraints] = None


class DeliveryStop(BaseModel):
    stop_id: str
    client_id: str
    customer_name: str
    lat: float
    lng: float
    demand_qty: int
    estimated_arrival: str
    order: int
    status: str = Field("pending", pattern="^(pending|in_transit|delivered)$")
    type: str = Field("delivery", pattern="^(warehouse|delivery)$")


class RouteDataCreate(BaseModel):
    route_id: str = Field(..., min_length=1, max_length=100)
    warehouse_id: str = Field(..., min_length=1, max_length=50)
    total_distance: float = Field(..., ge=0)
    estimated_time: float = Field(..., ge=0)
    estimated_cost: float = Field(..., ge=0)
    efficiency_score: float = Field(..., ge=0, le=100)
    status: str = Field("planned", pattern="^(planned|in_progress|completed)$")


class RouteDataResponse(RouteDataCreate):
    id: int
    stops: List[DeliveryStop]
    num_stops: int
    total_demand: int
    utilization: float
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class RouteStatistics(BaseModel):
    total_routes: int
    total_distance: float
    total_time: float
    total_cost: float
    total_stops: int
    average_distance: float
    average_time: float
    average_cost: float
    average_stops: float
    efficiency_distribution: dict
    overall_efficiency: float


class RouteEfficiency(BaseModel):
    route_id: str
    efficiency_score: float
    distance_efficiency: float
    time_efficiency: float
    capacity_utilization: float
    recommendations: List[str]
    last_updated: str


class RouteAnalytics(BaseModel):
    warehouse_id: str
    total_routes: int
    average_efficiency: float
    total_distance: float
    total_time: float
    total_cost: float
    route_distribution: dict
    last_updated: str
