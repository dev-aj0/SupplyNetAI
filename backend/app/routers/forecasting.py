from fastapi import APIRouter, HTTPException
from typing import List
import logging
from app.services.ai_integration_service import ai_service
from app.schemas.forecasts import ForecastRequest

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/forecast")
async def generate_forecast(request: ForecastRequest):
    """Generate AI-powered demand forecast"""
    try:
        logger.info(f"Generating forecast for {request.warehouse_id}-{request.sku_id}, horizon: {request.horizon_days}")
        return ai_service.generate_real_forecast(request.warehouse_id, request.sku_id, request.horizon_days)
    except Exception as e:
        logger.error(f"Error generating forecast: {e}")
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {str(e)}")

@router.post("/train")
async def train_forecasting_model(warehouse_id: str, sku_id: str, sales_data: List[dict]):
    """Train forecasting model with new data"""
    try:
        logger.info(f"Training forecasting model for {warehouse_id}-{sku_id}")
        return ai_service.forecasting_service.train_model(warehouse_id, sku_id, sales_data)
    except Exception as e:
        logger.error(f"Error training model: {e}")
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

@router.get("/models/list")
async def get_forecasting_models():
    """List available forecasting models"""
    try:
        logger.info("Listing forecasting models")
        return ai_service.forecasting_service.get_model_status("WH001", "SKU001")
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=f"Model listing failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check for forecasting service"""
    return {
        "status": "healthy",
        "service": "forecasting",
        "timestamp": "2024-01-01T00:00:00Z"
    }
