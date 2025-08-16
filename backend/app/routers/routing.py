from fastapi import APIRouter, HTTPException
from typing import List, Dict
import logging
from app.services.ai_integration_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/optimize")
async def optimize_routes(warehouse_id: str, delivery_points: List[Dict]):
    """Optimize delivery routes using AI"""
    try:
        logger.info(f"Optimizing routes for warehouse {warehouse_id}")
        return ai_service.optimize_real_routes(warehouse_id, delivery_points)
    except Exception as e:
        logger.error(f"Error optimizing routes: {e}")
        raise HTTPException(status_code=500, detail=f"Route optimization failed: {str(e)}")

@router.get("/analytics/global")
async def get_global_routing_analytics():
    """Get global routing analytics"""
    try:
        logger.info("Getting global routing analytics")
        return ai_service.get_global_routing_analytics()
    except Exception as e:
        logger.error(f"Error getting routing analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Routing analytics failed: {str(e)}")
