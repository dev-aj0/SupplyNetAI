from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AnomalyDetectionRequest(BaseModel):
    warehouse_id: str = Field(..., min_length=1, max_length=50)
    sku_id: str = Field(..., min_length=1, max_length=100)


class AnomalyDataCreate(BaseModel):
    timestamp: datetime
    warehouse_id: str = Field(..., min_length=1, max_length=50)
    sku_id: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., pattern="^(spike|drop|unusual_pattern)$")
    severity: str = Field(..., pattern="^(low|medium|high)$")
    description: str = Field(..., min_length=1)
    impact_percentage: float = Field(..., ge=0)
    suggested_action: str = Field(..., min_length=1)


class AnomalyDataResponse(AnomalyDataCreate):
    id: int
    anomaly_id: str
    status: str = Field("open", pattern="^(open|investigating|resolved)$")
    resolved_at: Optional[datetime] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class AnomalyDetectionResult(BaseModel):
    warehouse_id: str
    sku_id: str
    total_anomalies: int
    anomalies: List[dict]


class AnomalySummary(BaseModel):
    total_anomalies: int
    open_anomalies: int
    resolved_anomalies: int
    severity_distribution: dict
    type_distribution: dict
    warehouse_distribution: dict
    last_updated: str


class AnomalyFilter(BaseModel):
    warehouse_id: Optional[str] = None
    sku_id: Optional[str] = None
    severity: Optional[str] = None
    anomaly_type: Optional[str] = None
    limit: int = 100
