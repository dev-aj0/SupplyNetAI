from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
import logging
from app.services.optimization_service import StockOptimizationService
from app.services.forecasting_service import ForecastingService
from app.schemas.inventory import StockRecommendation, StockRecommendationRequest
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.services.ai_integration_service import AIIntegrationService
from app.services.ai_integration_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
forecasting_service = ForecastingService()
optimization_service = StockOptimizationService(forecasting_service)

# Initialize AI service
ai_service = AIIntegrationService()


@router.post("/stock/recommendations")
async def get_stock_recommendations(request: StockRecommendationRequest):
    """Get AI-powered stock recommendations using REAL ML"""
    try:
        logger.info(f"Getting REAL ML stock recommendations for {request.warehouse_id}-{request.sku_id}")
        return ai_service.generate_real_stock_recommendations(request.warehouse_id, request.sku_id)
    except Exception as e:
        logger.error(f"Error generating stock recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Stock optimization failed: {str(e)}")


@router.post("/stock/recommendations/batch")
async def get_batch_stock_recommendations(sales_data: List[Dict]):
    """Get stock optimization recommendations for all warehouse-SKU combinations"""
    try:
        if not sales_data:
            raise HTTPException(status_code=400, detail="Sales data is required")
        
        # Calculate stock recommendations for all combinations
        results = optimization_service.optimize_all_warehouses(sales_data)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Batch stock recommendations generated successfully",
                "data": {
                    "total_combinations": len(results),
                    "results": results
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating batch stock recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/stock-recommendations")
async def get_stock_recommendations_simple(
    warehouse_id: Optional[str] = Query(None, description="Filter by warehouse ID")
):
    """Get stock recommendations without requiring sales data (for dashboard display)"""
    try:
        # Generate mock stock recommendations for demonstration
        mock_recommendations = []
        
        # Generate recommendations for different warehouse-SKU combinations
        warehouses = ["WH001", "WH002", "WH003", "WH004", "WH005"]
        skus = [f"SKU00{i:02d}" for i in range(1, 21)]
        
        for i, warehouse in enumerate(warehouses):
            for j, sku in enumerate(skus):
                if warehouse_id and warehouse != warehouse_id:
                    continue
                    
                # Generate mock recommendation
                current_stock = (i * 20 + j) % 200 + 50
                recommended_stock = current_stock + (i * 10 + j * 5) % 100
                status = "urgent" if current_stock < 75 else "low" if current_stock < 120 else "optimal" if current_stock < 180 else "excess"
                
                recommendation = {
                    "warehouse_id": warehouse,
                    "sku_id": sku,
                    "current_stock": current_stock,
                    "recommended_stock": recommended_stock,
                    "status": status,
                    "action": "increase" if status in ["urgent", "low"] else "decrease" if status == "excess" else "maintain",
                    "priority": "high" if status == "urgent" else "medium" if status == "low" else "low",
                    "estimated_cost": (recommended_stock - current_stock) * 25.99,
                    "last_updated": "2024-01-01T00:00:00Z"
                }
                
                mock_recommendations.append(recommendation)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Stock recommendations retrieved successfully",
                "data": mock_recommendations,
                "total_recommendations": len(mock_recommendations),
                "summary": {
                    "urgent": len([r for r in mock_recommendations if r["status"] == "urgent"]),
                    "low": len([r for r in mock_recommendations if r["status"] == "low"]),
                    "optimal": len([r for r in mock_recommendations if r["status"] == "optimal"]),
                    "excess": len([r for r in mock_recommendations if r["status"] == "excess"])
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting stock recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/inventory-status")
async def get_inventory_status_simple(
    warehouse_id: Optional[str] = Query(None, description="Filter by warehouse ID")
):
    """Get inventory status without requiring sales data (for dashboard display)"""
    try:
        # Generate mock inventory status for demonstration
        mock_status = []
        
        # Generate status for different warehouse-SKU combinations
        warehouses = ["WH001", "WH002", "WH003", "WH004", "WH005"]
        skus = [f"SKU00{i:02d}" for i in range(1, 21)]
        
        for i, warehouse in enumerate(warehouses):
            for j, sku in enumerate(skus):
                if warehouse_id and warehouse != warehouse_id:
                    continue
                    
                # Generate mock status
                current_stock = (i * 20 + j) % 200 + 50
                reorder_point = 80
                max_stock = 200
                
                status = {
                    "warehouse_id": warehouse,
                    "sku_id": sku,
                    "current_stock": current_stock,
                    "reorder_point": reorder_point,
                    "max_stock": max_stock,
                    "status": "urgent" if current_stock < reorder_point else "low" if current_stock < reorder_point * 1.5 else "optimal" if current_stock < max_stock * 0.8 else "excess",
                    "days_of_inventory": max(1, current_stock // 10),  # Mock calculation
                    "last_updated": "2024-01-01T00:00:00Z"
                }
                
                mock_status.append(status)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Inventory status retrieved successfully",
                "data": mock_status,
                "total_items": len(mock_status)
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting inventory status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/stock/status/{warehouse_id}/{sku_id}")
async def get_stock_status(
    warehouse_id: str,
    sku_id: str
):
    """Get current stock status for a specific warehouse-SKU combination"""
    try:
        # This would typically query a database for current stock levels
        # For now, return a placeholder response
        return JSONResponse(
            status_code=200,
            content={
                "message": "Stock status retrieved successfully",
                "data": {
                    "warehouse_id": warehouse_id,
                    "sku_id": sku_id,
                    "current_stock": 150,  # Placeholder
                    "last_updated": "2024-01-01T00:00:00Z",
                    "note": "This is placeholder data. Connect to inventory system for real-time data."
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting stock status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/stock/optimize")
async def optimize_stock_levels(
    warehouse_id: str = Query(..., description="Warehouse ID"),
    sku_id: str = Query(..., description="SKU ID"),
    current_stock: int = Query(..., ge=0, description="Current stock level"),
    lead_time_days: int = Query(..., ge=1, le=30, description="Lead time in days"),
    target_service_level: float = Query(0.95, ge=0.8, le=0.99, description="Target service level"),
    sales_data: List[Dict] = None
):
    """Optimize stock levels with custom parameters"""
    try:
        if not sales_data:
            raise HTTPException(status_code=400, detail="Sales data is required")
        
        # Update service parameters
        optimization_service.safety_stock_multiplier = _get_z_score(target_service_level)
        
        # Calculate recommendations
        result = optimization_service.calculate_stock_recommendations(
            sales_data, warehouse_id, sku_id
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['error'])
        
        # Override with provided parameters
        result['data']['current_stock'] = current_stock
        result['data']['lead_time_days'] = lead_time_days
        result['data']['target_service_level'] = target_service_level
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Stock optimization completed successfully",
                "data": result
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error optimizing stock levels: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/stock/analytics/{warehouse_id}")
async def get_warehouse_stock_analytics(warehouse_id: str):
    """Get comprehensive stock analytics for a warehouse"""
    try:
        # This would typically aggregate data from multiple SKUs
        # For now, return a placeholder response
        return JSONResponse(
            status_code=200,
            content={
                "message": "Warehouse stock analytics retrieved successfully",
                "data": {
                    "warehouse_id": warehouse_id,
                    "total_skus": 20,  # Placeholder
                    "stock_status_summary": {
                        "urgent": 3,
                        "low": 5,
                        "optimal": 10,
                        "excess": 2
                    },
                    "total_inventory_value": 125000,  # Placeholder
                    "average_stock_turnover": 12.5,  # Placeholder
                    "last_updated": "2024-01-01T00:00:00Z"
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting warehouse stock analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/stock/analytics/global")
async def get_global_stock_analytics():
    """Get global stock analytics across all warehouses using REAL ML"""
    try:
        logger.info("Getting global stock analytics with REAL ML")
        return ai_service.get_global_stock_analytics()
    except Exception as e:
        logger.error(f"Error getting stock analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Stock analytics failed: {str(e)}")


@router.post("/stock/what-if")
async def what_if_analysis(
    warehouse_id: str = Query(..., description="Warehouse ID"),
    sku_id: str = Query(..., description="SKU ID"),
    scenario: str = Query(..., description="Scenario type: demand_increase, demand_decrease, lead_time_change"),
    change_percentage: float = Query(..., description="Percentage change for the scenario"),
    sales_data: List[Dict] = None
):
    """Perform what-if analysis for stock optimization"""
    try:
        if not sales_data:
            raise HTTPException(status_code=400, detail="Sales data is required")
        
        # Create modified sales data based on scenario
        modified_sales_data = _apply_scenario_to_data(
            sales_data, scenario, change_percentage
        )
        
        # Calculate recommendations with modified data
        result = optimization_service.calculate_stock_recommendations(
            modified_sales_data, warehouse_id, sku_id
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['error'])
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "What-if analysis completed successfully",
                "data": {
                    "scenario": scenario,
                    "change_percentage": change_percentage,
                    "recommendations": result,
                    "comparison": {
                        "note": "Compare with baseline recommendations to see impact"
                    }
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing what-if analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


def _get_z_score(service_level: float) -> float:
    """Get Z-score for a given service level"""
    # Simplified Z-score mapping
    z_scores = {
        0.80: 0.84,
        0.85: 1.04,
        0.90: 1.28,
        0.95: 1.65,
        0.99: 2.33
    }
    
    # Find closest service level
    closest_level = min(z_scores.keys(), key=lambda x: abs(x - service_level))
    return z_scores[closest_level]


def _apply_scenario_to_data(sales_data: List[Dict], scenario: str, change_percentage: float) -> List[Dict]:
    """Apply scenario changes to sales data"""
    modified_data = []
    
    for record in sales_data:
        modified_record = record.copy()
        
        if scenario == "demand_increase":
            modified_record['units_sold'] = int(record['units_sold'] * (1 + change_percentage / 100))
        elif scenario == "demand_decrease":
            modified_record['units_sold'] = int(record['units_sold'] * (1 - change_percentage / 100))
        elif scenario == "lead_time_change":
            # For lead time changes, we don't modify sales data
            # The change would be applied in the optimization service
            pass
        
        modified_data.append(modified_record)
    
    return modified_data


@router.get("/health")
async def health_check():
    """Health check for optimization service"""
    return {
        "status": "healthy",
        "service": "optimization",
        "timestamp": "2024-01-01T00:00:00Z"
    }
