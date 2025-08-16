from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


class ForecastRequest(BaseModel):
    warehouse_id: str = Field(..., min_length=1, max_length=50)
    sku_id: str = Field(..., min_length=1, max_length=100)
    horizon_days: int = Field(7, ge=1, le=30, description="Forecast horizon in days")


class ForecastDataCreate(BaseModel):
    date: date
    warehouse_id: str = Field(..., min_length=1, max_length=50)
    sku_id: str = Field(..., min_length=1, max_length=100)
    predicted_demand: float = Field(..., ge=0)
    confidence_lower: float = Field(..., ge=0)
    confidence_upper: float = Field(..., ge=0)
    actual_demand: Optional[float] = Field(None, ge=0)
    model_version: Optional[str] = Field(None, max_length=50)
    accuracy_score: Optional[float] = Field(None, ge=0, le=100)


class ForecastDataResponse(ForecastDataCreate):
    id: int
    created_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class ModelPerformance(BaseModel):
    mape: Optional[float] = Field(None, ge=0, le=100, description="Mean Absolute Percentage Error")
    rmse: Optional[float] = Field(None, ge=0, description="Root Mean Square Error")
    mae: Optional[float] = Field(None, ge=0, description="Mean Absolute Error")
    cv_periods: int = Field(0, ge=0, description="Number of cross-validation periods")


class ModelStatus(BaseModel):
    status: str = Field(..., description="Model status: loaded, saved, or not_found")
    metrics: Optional[ModelPerformance] = None
    last_updated: Optional[str] = None
