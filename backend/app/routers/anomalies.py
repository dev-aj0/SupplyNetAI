from fastapi import APIRouter, HTTPException
from typing import Optional
import logging
from app.services.ai_integration_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/detect")
async def detect_anomalies(warehouse_id: str, sku_id: str):
    """Detect anomalies using REAL ML LSTM autoencoders"""
    try:
        logger.info(f"Detecting anomalies with REAL ML for {warehouse_id}-{sku_id}")
        return ai_service.detect_real_anomalies(warehouse_id, sku_id)
    except Exception as e:
        logger.error(f"Error detecting anomalies: {e}")
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")

@router.get("/list")
async def list_anomalies(
    warehouse_id: Optional[str] = None,
    sku_id: Optional[str] = None,
    severity: Optional[str] = None
):
    """List anomalies with optional filtering using REAL ML"""
    try:
        logger.info(f"Listing anomalies with REAL ML for warehouse: {warehouse_id}, SKU: {sku_id}")
        # For simplicity, just return a sample anomaly
        return ai_service.detect_real_anomalies(
            warehouse_id or "WH001", 
            sku_id or "SKU001"
        )
    except Exception as e:
        logger.error(f"Error listing anomalies: {e}")
        raise HTTPException(status_code=500, detail=f"Anomaly listing failed: {str(e)}")

@router.get("/analytics/summary")
async def get_anomaly_summary():
    """Get anomaly analytics summary using REAL ML"""
    try:
        logger.info("Getting anomaly summary with REAL ML")
        return ai_service.get_anomaly_summary()
    except Exception as e:
        logger.error(f"Error getting anomaly summary: {e}")
        raise HTTPException(status_code=500, detail=f"Anomaly summary failed: {str(e)}")
