from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.services.data_processing_service import ProductionDataService
from app.services.ai_integration_service import AIIntegrationService
import logging
import tempfile
import os
import pandas as pd
import io
from datetime import datetime
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["data_ingestion"])

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
async def upload_csv(file: UploadFile = File(...)):
    """Upload CSV file for processing"""
    try:
        print(f"=== UPLOAD DEBUG ===")
        print(f"Received file: {file.filename}")
        
        # Read the CSV file
        content = await file.read()
        print(f"File content length: {len(content)}")
        
        # Parse CSV
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        print(f"Parsed CSV with {len(df)} rows and columns: {list(df.columns)}")
        
        # Create data directory in project root (correct path)
        current_dir = os.getcwd()  # /Users/MAC/Downloads/supplynet/backend
        data_dir = os.path.join(current_dir, "..", "data")  # Go up one level, then into data
        data_dir = os.path.abspath(data_dir)  # Get absolute path
        print(f"Current dir: {current_dir}")
        print(f"Data dir: {data_dir}")
        
        os.makedirs(data_dir, exist_ok=True)
        print(f"Created data directory: {data_dir}")
        
        # Process each warehouse/SKU combination
        processed_files = []
        for warehouse_id in df['warehouse_id'].unique():
            for sku_id in df['sku_id'].unique():
                print(f"Processing {warehouse_id} - {sku_id}")
                
                # Filter data for this warehouse/SKU
                filtered_df = df[(df['warehouse_id'] == warehouse_id) & (df['sku_id'] == sku_id)]
                
                if len(filtered_df) > 0:
                    # Save to JSON file
                    filename = f"{warehouse_id}_{sku_id}_sales.json"
                    filepath = os.path.join(data_dir, filename)
                    
                    # Convert DataFrame to list of dictionaries
                    data_list = filtered_df.to_dict('records')
                    
                    with open(filepath, 'w') as f:
                        json.dump(data_list, f, indent=2, default=str)
                    
                    processed_files.append(filename)
                    print(f"Saved {filename} with {len(data_list)} records")
        
        result = {
            "status": "success",
            "message": f"File uploaded and processed successfully. Created {len(processed_files)} data files.",
            "rows_processed": len(df),
            "files_created": processed_files,
            "columns": list(df.columns)
        }
        
        print(f"Upload complete: {result}")
        print(f"=== END UPLOAD DEBUG ===")
        return JSONResponse(content={"result": result}, status_code=200)
        
    except Exception as e:
        print(f"ERROR in upload_csv: {str(e)}")
        import traceback
        traceback.print_exc()
        logging.error(f"Error uploading CSV: {str(e)}")
        return JSONResponse(
            content={"result": {"status": "error", "message": str(e)}},
            status_code=500
        )

@router.options("/upload/csv")
async def upload_csv_options():
    """Handle preflight OPTIONS request"""
    return JSONResponse(content={}, status_code=200)

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
