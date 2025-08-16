from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


class SalesDataCreate(BaseModel):
    date: date
    warehouse_id: str = Field(..., min_length=1, max_length=50)
    sku_id: str = Field(..., min_length=1, max_length=100)
    units_sold: int = Field(..., ge=0)
    order_id: Optional[str] = Field(None, max_length=100)
    client_id: Optional[str] = Field(None, max_length=100)
    location_lat: Optional[float] = Field(None, ge=-90, le=90)
    location_lng: Optional[float] = Field(None, ge=-180, le=180)


class SalesDataResponse(SalesDataCreate):
    id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class SalesDataBatch(BaseModel):
    data: List[SalesDataCreate]
    total_records: int
    warehouse_id: Optional[str] = None
    date_range: Optional[str] = None
