from fastapi import APIRouter, HTTPException
from typing import Optional
import logging
from app.services.ai_integration_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/overview")
async def get_dashboard_overview():
    """Get comprehensive dashboard overview with simplified AI metrics"""
    try:
        logger.info("Generating dashboard overview")
        return ai_service.get_dashboard_overview()
    except Exception as e:
        logger.error(f"Error getting dashboard overview: {e}")
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")

@router.get("/sales-data")
async def get_sales_data(
    warehouse_id: Optional[str] = None,
    sku_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get sales data with optional filtering"""
    try:
        logger.info(f"Getting sales data for warehouse: {warehouse_id}, SKU: {sku_id}")
        return ai_service.get_sales_data(warehouse_id, sku_id)
    except Exception as e:
        logger.error(f"Error getting sales data: {e}")
        raise HTTPException(status_code=500, detail=f"Sales data error: {str(e)}")
