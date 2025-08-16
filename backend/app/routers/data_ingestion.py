from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.services.data_processing_service import ProductionDataService
import logging
import tempfile
import os

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize service
data_service = ProductionDataService()

class DataIngestionRequest(BaseModel):
    data_source: str
    options: Dict = {}

class SyntheticDataRequest(BaseModel):
    warehouse_count: int = 5
    sku_count: int = 20
    days: int = 365

class MarketDataRequest(BaseModel):
    symbols: List[str]
    period: str = "1y"

class QualityValidationRequest(BaseModel):
    sales_data: List[Dict]

@router.post("/ingest")
async def ingest_sales_data(request: DataIngestionRequest):
    """Ingest sales data from various sources"""
    try:
        result = data_service.ingest_sales_data(
            request.data_source,
            **request.options
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['error'])
        
        return {
            "message": f"Data ingested successfully from {request.data_source}",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error ingesting data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload/csv")
async def upload_csv_file(file: UploadFile = File(...)):
    """Upload and process CSV file"""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Process the CSV file
            result = data_service.ingest_sales_data('csv', file_path=temp_file_path)
            
            if result['status'] == 'error':
                raise HTTPException(status_code=400, detail=result['error'])
            
            return {
                "message": "CSV file processed successfully",
                "result": result
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        
    except Exception as e:
        logger.error(f"Error processing CSV file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload/excel")
async def upload_excel_file(file: UploadFile = File(...)):
    """Upload and process Excel file"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are supported")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Process the Excel file
            result = data_service.ingest_sales_data('excel', file_path=temp_file_path)
            
            if result['status'] == 'error':
                raise HTTPException(status_code=400, detail=result['error'])
            
            return {
                "message": "Excel file processed successfully",
                "result": result
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        
    except Exception as e:
        logger.error(f"Error processing Excel file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/synthetic-data")
async def generate_synthetic_data(request: SyntheticDataRequest):
    """Generate synthetic training data"""
    try:
        result = data_service.generate_synthetic_training_data(
            warehouse_count=request.warehouse_count,
            sku_count=request.sku_count,
            days=request.days
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['error'])
        
        return {
            "message": "Synthetic data generated successfully",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error generating synthetic data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate-quality")
async def validate_data_quality(request: QualityValidationRequest):
    """Validate data quality for LSTM training"""
    try:
        result = data_service.validate_data_quality(request.sales_data)
        
        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['error'])
        
        return {
            "message": "Data quality validation completed",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error validating data quality: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/market-data")
async def get_market_data(request: MarketDataRequest):
    """Fetch external market data for feature engineering"""
    try:
        result = data_service.get_external_market_data(
            symbols=request.symbols,
            period=request.period
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['error'])
        
        return {
            "message": "Market data fetched successfully",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error fetching market data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check for data ingestion service"""
    return {
        "status": "healthy",
        "service": "Production Data Service",
        "supported_sources": ["csv", "excel", "api", "database"],
        "data_cache_size": len(data_service.data_cache)
    }
