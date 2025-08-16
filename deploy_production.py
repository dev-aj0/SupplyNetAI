#!/usr/bin/env python3
"""
Production Deployment Script for SupplyNet LSTM Models
This script sets up the production environment and validates the LSTM models.
"""

import os
import sys
import json
import logging
import requests
import time
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
API_BASE_URL = "http://localhost:8001/api/v1"
BACKEND_DIR = "backend"
MODELS_DIR = "models"
SCALERS_DIR = "scalers"
METRICS_DIR = "metrics"

class ProductionDeployer:
    def __init__(self):
        self.api_base = API_BASE_URL
        self.backend_dir = Path(BACKEND_DIR)
        
    def check_backend_health(self):
        """Check if the backend is running and healthy"""
        try:
            response = requests.get(f"{self.api_base}/health", timeout=10)
            if response.status_code == 200:
                logger.info("✅ Backend is healthy and running")
                return True
            else:
                logger.error(f"❌ Backend returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Cannot connect to backend: {e}")
            return False
    
    def create_directories(self):
        """Create necessary directories for models and data"""
        directories = [
            MODELS_DIR,
            SCALERS_DIR,
            METRICS_DIR,
            f"{MODELS_DIR}/anomaly_models",
            f"{SCALERS_DIR}/anomaly_scalers",
            f"{METRICS_DIR}/anomaly_thresholds"
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
            logger.info(f"✅ Created directory: {directory}")
    
    def generate_synthetic_training_data(self):
        """Generate synthetic data for initial model training"""
        try:
            logger.info("Generating synthetic training data...")
            
            response = requests.post(
                f"{self.api_base}/synthetic-data",
                json={
                    "warehouse_count": 5,
                    "sku_count": 20,
                    "days": 365
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Generated {result['result']['data_count']} synthetic records")
                return result['result']['data']
            else:
                logger.error(f"❌ Failed to generate synthetic data: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error generating synthetic data: {e}")
            return None
    
    def validate_data_quality(self, sales_data):
        """Validate the quality of training data"""
        try:
            logger.info("Validating data quality...")
            
            response = requests.post(
                f"{self.api_base}/validate-quality",
                json={"sales_data": sales_data},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                quality_score = result['result']['quality_score']
                logger.info(f"✅ Data quality score: {quality_score}/100")
                
                if quality_score < 80:
                    logger.warning("⚠️  Data quality could be improved")
                    for issue in result['result']['issues']:
                        logger.warning(f"  - {issue}")
                
                return quality_score >= 50  # Minimum threshold for training
            else:
                logger.error(f"❌ Failed to validate data quality: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error validating data quality: {e}")
            return False
    
    def train_forecasting_models(self, sales_data):
        """Train LSTM forecasting models"""
        try:
            logger.info("Training LSTM forecasting models...")
            
            # Get unique warehouse-SKU combinations
            combinations = set()
            for record in sales_data:
                combinations.add((record['warehouse_id'], record['sku_id']))
            
            logger.info(f"Found {len(combinations)} warehouse-SKU combinations")
            
            # Train models in batches
            batch_size = 5
            combinations_list = list(combinations)
            
            for i in range(0, len(combinations_list), batch_size):
                batch = combinations_list[i:i + batch_size]
                logger.info(f"Training batch {i//batch_size + 1}/{(len(combinations_list) + batch_size - 1)//batch_size}")
                
                for warehouse_id, sku_id in batch:
                    try:
                        # Filter data for this combination
                        filtered_data = [
                            record for record in sales_data 
                            if record['warehouse_id'] == warehouse_id and record['sku_id'] == sku_id
                        ]
                        
                        if len(filtered_data) >= 100:  # Minimum data requirement
                            response = requests.post(
                                f"{self.api_base}/train",
                                json={
                                    "warehouse_id": warehouse_id,
                                    "sku_id": sku_id,
                                    "sales_data": filtered_data
                                },
                                timeout=120
                            )
                            
                            if response.status_code == 200:
                                result = response.json()
                                logger.info(f"✅ Trained forecasting model for {warehouse_id}-{sku_id}")
                            else:
                                logger.warning(f"⚠️  Failed to train model for {warehouse_id}-{sku_id}")
                        else:
                            logger.warning(f"⚠️  Insufficient data for {warehouse_id}-{sku_id}: {len(filtered_data)} records")
                            
                    except Exception as e:
                        logger.error(f"❌ Error training model for {warehouse_id}-{sku_id}: {e}")
                
                # Small delay between batches
                time.sleep(2)
            
            logger.info("✅ Forecasting model training completed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error training forecasting models: {e}")
            return False
    
    def train_anomaly_detectors(self, sales_data):
        """Train LSTM anomaly detection models"""
        try:
            logger.info("Training LSTM anomaly detectors...")
            
            # Get unique warehouse-SKU combinations
            combinations = set()
            for record in sales_data:
                combinations.add((record['warehouse_id'], record['sku_id']))
            
            logger.info(f"Found {len(combinations)} warehouse-SKU combinations")
            
            # Train detectors in batches
            batch_size = 5
            combinations_list = list(combinations)
            
            for i in range(0, len(combinations_list), batch_size):
                batch = combinations_list[i:i + batch_size]
                logger.info(f"Training batch {i//batch_size + 1}/{(len(combinations_list) + batch_size - 1)//batch_size}")
                
                for warehouse_id, sku_id in batch:
                    try:
                        # Filter data for this combination
                        filtered_data = [
                            record for record in sales_data 
                            if record['warehouse_id'] == warehouse_id and record['sku_id'] == sku_id
                        ]
                        
                        if len(filtered_data) >= 100:  # Minimum data requirement
                            response = requests.post(
                                f"{self.api_base}/train-detector",
                                json={
                                    "warehouse_id": warehouse_id,
                                    "sku_id": sku_id,
                                    "sales_data": filtered_data
                                },
                                timeout=120
                            )
                            
                            if response.status_code == 200:
                                result = response.json()
                                logger.info(f"✅ Trained anomaly detector for {warehouse_id}-{sku_id}")
                            else:
                                logger.warning(f"⚠️  Failed to train detector for {warehouse_id}-{sku_id}")
                        else:
                            logger.warning(f"⚠️  Insufficient data for {warehouse_id}-{sku_id}: {len(filtered_data)} records")
                            
                    except Exception as e:
                        logger.error(f"❌ Error training detector for {warehouse_id}-{sku_id}: {e}")
                
                # Small delay between batches
                time.sleep(2)
            
            logger.info("✅ Anomaly detector training completed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error training anomaly detectors: {e}")
            return False
    
    def test_forecasting(self):
        """Test the forecasting models"""
        try:
            logger.info("Testing forecasting models...")
            
            # Test with a sample warehouse-SKU combination
            test_warehouse = "WH001"
            test_sku = "SKU-001"
            
            response = requests.get(
                f"{self.api_base}/forecasting/forecast",
                params={
                    "warehouse_id": test_warehouse,
                    "sku_id": test_sku,
                    "horizon_days": 7
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result['status'] == 'success':
                    logger.info(f"✅ Forecasting test successful for {test_warehouse}-{test_sku}")
                    logger.info(f"  Generated {len(result['forecast_data'])} forecast points")
                    return True
                else:
                    logger.warning(f"⚠️  Forecasting test returned error: {result.get('error', 'Unknown error')}")
                    return False
            else:
                logger.warning(f"⚠️  Forecasting test failed with status {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error testing forecasting: {e}")
            return False
    
    def test_anomaly_detection(self):
        """Test the anomaly detection models"""
        try:
            logger.info("Testing anomaly detection models...")
            
            # Generate some test data
            test_data = []
            for i in range(30):  # 30 days of test data
                test_data.append({
                    "date": f"2024-01-{i+1:02d}",
                    "warehouse_id": "WH001",
                    "sku_id": "SKU-001",
                    "units_sold": 50 + (i % 10),  # Some variation
                    "order_id": f"TEST-{i}",
                    "client_id": "TEST-CLIENT",
                    "location_lat": 40.0,
                    "location_lng": -74.0
                })
            
            response = requests.post(
                f"{self.api_base}/anomalies/detect",
                json={
                    "warehouse_id": "WH001",
                    "sku_id": "SKU-001",
                    "recent_data": test_data
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result['status'] == 'success':
                    logger.info(f"✅ Anomaly detection test successful")
                    logger.info(f"  Analyzed {result['total_sequences_analyzed']} sequences")
                    logger.info(f"  Found {result['anomaly_count']} anomalies")
                    return True
                else:
                    logger.warning(f"⚠️  Anomaly detection test returned error: {result.get('error', 'Unknown error')}")
                    return False
            else:
                logger.warning(f"⚠️  Anomaly detection test failed with status {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error testing anomaly detection: {e}")
            return False
    
    def get_system_status(self):
        """Get overall system status"""
        try:
            logger.info("Getting system status...")
            
            # Check forecasting service
            forecast_response = requests.get(f"{self.api_base}/forecasting/health", timeout=10)
            if forecast_response.status_code == 200:
                forecast_status = forecast_response.json()
                logger.info(f"✅ Forecasting Service: {forecast_status['models_loaded']} models loaded")
            
            # Check anomaly service
            anomaly_response = requests.get(f"{self.api_base}/anomalies/health", timeout=10)
            if anomaly_response.status_code == 200:
                anomaly_status = anomaly_response.json()
                logger.info(f"✅ Anomaly Service: {anomaly_status['detectors_loaded']} detectors loaded")
            
            # Check data service
            data_response = requests.get(f"{self.api_base}/data-ingestion/health", timeout=10)
            if data_response.status_code == 200:
                data_status = data_response.json()
                logger.info(f"✅ Data Service: {len(data_status['supported_sources'])} sources supported")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error getting system status: {e}")
            return False
    
    def deploy(self):
        """Main deployment process"""
        logger.info("🚀 Starting Production Deployment for SupplyNet LSTM Models")
        logger.info("=" * 60)
        
        # Step 1: Check backend health
        if not self.check_backend_health():
            logger.error("❌ Backend health check failed. Please start the backend first.")
            return False
        
        # Step 2: Create directories
        self.create_directories()
        
        # Step 3: Generate training data
        sales_data = self.generate_synthetic_training_data()
        if not sales_data:
            logger.error("❌ Failed to generate training data")
            return False
        
        # Step 4: Validate data quality
        if not self.validate_data_quality(sales_data):
            logger.error("❌ Data quality validation failed")
            return False
        
        # Step 5: Train forecasting models
        if not self.train_forecasting_models(sales_data):
            logger.error("❌ Forecasting model training failed")
            return False
        
        # Step 6: Train anomaly detectors
        if not self.train_anomaly_detectors(sales_data):
            logger.error("❌ Anomaly detector training failed")
            return False
        
        # Step 7: Test the models
        logger.info("🧪 Testing deployed models...")
        
        if not self.test_forecasting():
            logger.warning("⚠️  Forecasting test failed")
        
        if not self.test_anomaly_detection():
            logger.warning("⚠️  Anomaly detection test failed")
        
        # Step 8: Get final system status
        self.get_system_status()
        
        logger.info("=" * 60)
        logger.info("🎉 Production Deployment Completed!")
        logger.info("")
        logger.info("Next steps:")
        logger.info("1. Monitor model performance using the dashboard")
        logger.info("2. Retrain models monthly with new data")
        logger.info("3. Set up alerts for model degradation")
        logger.info("4. Integrate with your real data sources")
        logger.info("")
        logger.info("For more information, see LSTM_TRAINING_GUIDE.md")
        
        return True

def main():
    """Main entry point"""
    deployer = ProductionDeployer()
    
    try:
        success = deployer.deploy()
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except KeyboardInterrupt:
        logger.info("Deployment interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error during deployment: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
