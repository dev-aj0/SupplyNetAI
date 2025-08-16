from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class StockRecommendationRequest(BaseModel):
    warehouse_id: str = Field(..., min_length=1, max_length=50)
    sku_id: str = Field(..., min_length=1, max_length=100)


class InventoryDataCreate(BaseModel):
    warehouse_id: str = Field(..., min_length=1, max_length=50)
    sku_id: str = Field(..., min_length=1, max_length=100)
    current_stock: int = Field(..., ge=0)
    safety_stock: int = Field(..., ge=0)
    reorder_point: int = Field(..., ge=0)
    recommended_order_qty: int = Field(..., ge=0)
    lead_time_days: int = Field(..., ge=1, le=30)
    unit_cost: Optional[float] = Field(None, ge=0)
    status: str = Field(..., pattern="^(urgent|low|optimal|excess)$")


class InventoryDataResponse(InventoryDataCreate):
    id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class StockRecommendation(BaseModel):
    warehouse_id: str
    sku_id: str
    current_stock: int
    safety_stock: int
    reorder_point: int
    recommended_order_qty: int
    lead_time_days: int
    status: str
    stockout_risk: float
    excess_inventory_cost: float
    demand_statistics: dict
    last_updated: str


class DemandStatistics(BaseModel):
    mean_daily_demand: float
    std_daily_demand: float
    median_daily_demand: float
    p95_daily_demand: float
    p99_daily_demand: float
    trend: dict
    seasonality: dict
    coefficient_of_variation: float
    total_days: int
    total_demand: int


class TrendAnalysis(BaseModel):
    slope: float
    intercept: float
    r_squared: float
    p_value: float
    trend_direction: str
    trend_strength: str


class SeasonalityAnalysis(BaseModel):
    weekly_pattern: str
    monthly_pattern: str


class StockAnalytics(BaseModel):
    warehouse_id: str
    total_skus: int
    stock_status_summary: dict
    total_inventory_value: float
    average_stock_turnover: float
    last_updated: str
