#!/usr/bin/env python3
"""
SupplyNet Backend Startup Script
Initializes the application with sample data and pre-trained models
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent))

from app.services.data_processing_service import ProductionDataService
from app.services.forecasting_service import LSTMForecastingService
from app.services.optimization_service import StockOptimizationService
from app.services.anomaly_service import LSTMAnomalyService
from app.services.routing_service import RouteOptimizationService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def initialize_sample_data():
    """Initialize the system with sample data"""
    try:
        logger.info("Initializing sample data...")
        
        # Initialize services
        data_service = ProductionDataService()
        forecasting_service = LSTMForecastingService()
        optimization_service = StockOptimizationService(forecasting_service)
        anomaly_service = LSTMAnomalyService()
        routing_service = RouteOptimizationService()
        
        # Generate sample sales data
        logger.info("Generating sample sales data...")
        sample_sales_result = data_service.generate_synthetic_training_data(
            warehouse_count=5,
            sku_count=15,
            days=365
        )
        
        if sample_sales_result['status'] == 'success':
            sample_sales = sample_sales_result['data']
            logger.info(f"Generated {len(sample_sales)} sample sales records")
        else:
            logger.error(f"Failed to generate sample data: {sample_sales_result.get('error')}")
            sample_sales = []
        
        logger.info(f"Generated {len(sample_sales)} sample sales records")
        
        # Train forecasting models for key combinations
        logger.info("Training forecasting models...")
        key_combinations = [
            ('WH001', 'SKU-ELEC-001'),
            ('WH001', 'SKU-HOME-001'),
            ('WH002', 'SKU-SPORT-001'),
            ('WH003', 'SKU-BOOK-001'),
            ('WH004', 'SKU-CLOTH-001')
        ]
        
        for warehouse_id, sku_id in key_combinations:
            # Filter data for this combination
            combination_data = [
                record for record in sample_sales 
                if record['warehouse_id'] == warehouse_id and record['sku_id'] == sku_id
            ]
            
            if len(combination_data) >= 30:  # Need sufficient data
                logger.info(f"Training model for {warehouse_id}-{sku_id}")
                result = forecasting_service.train_model(warehouse_id, sku_id, combination_data)
                if result['status'] == 'success':
                    logger.info(f"Model trained successfully for {warehouse_id}-{sku_id}")
                else:
                    logger.warning(f"Model training failed for {warehouse_id}-{sku_id}: {result.get('error', 'Unknown error')}")
        
        # Generate stock recommendations
        logger.info("Generating stock recommendations...")
        stock_recommendations = optimization_service.optimize_all_warehouses(sample_sales)
        logger.info(f"Generated stock recommendations for {len(stock_recommendations)} combinations")
        
        # Detect anomalies
        logger.info("Detecting anomalies...")
        # Get sample data for anomaly detection
        sample_anomaly_data = [
            record for record in sample_sales 
            if record['warehouse_id'] == 'WH001' and record['sku_id'] == 'SKU-ELEC-001'
        ]
        if sample_anomaly_data:
            all_anomalies = anomaly_service.detect_anomalies('WH001', 'SKU-ELEC-001', sample_anomaly_data)
            logger.info(f"Detected {len(all_anomalies.get('anomalies', []))} anomalies")
        else:
            logger.warning("No data available for anomaly detection")
        
        # Generate sample route data
        logger.info("Generating sample route data...")
        sample_warehouses = [
            {
                'warehouse_id': 'WH001',
                'name': 'Seattle Distribution',
                'lat': 47.6062,
                'lng': -122.3321,
                'capacity': 10000
            },
            {
                'warehouse_id': 'WH002',
                'name': 'Portland Hub',
                'lat': 45.5152,
                'lng': -122.6784,
                'capacity': 8000
            }
        ]
        
        sample_delivery_points = [
            {
                'client_id': 'CUST001',
                'customer_name': 'TechMart Seattle',
                'lat': 47.6205,
                'lng': -122.3493,
                'demand_qty': 50
            },
            {
                'client_id': 'CUST002',
                'customer_name': 'HomeGoods Portland',
                'lat': 45.5200,
                'lng': -122.6819,
                'demand_qty': 30
            }
        ]
        
        for warehouse in sample_warehouses:
            route_result = routing_service.optimize_routes(warehouse, sample_delivery_points)
            if route_result['status'] == 'success':
                logger.info(f"Routes optimized for {warehouse['warehouse_id']}")
            else:
                logger.warning(f"Route optimization failed for {warehouse['warehouse_id']}")
        
        logger.info("Sample data initialization completed successfully!")
        
    except Exception as e:
        logger.error(f"Error initializing sample data: {str(e)}")
        raise


async def check_services():
    """Check if all services are running properly"""
    try:
        logger.info("Checking service health...")
        
        # Test data processing service
        data_service = ProductionDataService()
        sample_data_result = data_service.generate_synthetic_training_data(warehouse_count=2, sku_count=3, days=30)
        if sample_data_result['status'] == 'success':
            sample_data = sample_data_result['data']
            assert len(sample_data) > 0, "Data processing service not working"
            logger.info("✓ Data processing service: OK")
        else:
            logger.warning(f"Data processing service test failed: {sample_data_result.get('error')}")
        
        # Test forecasting service
        forecasting_service = LSTMForecastingService()
        assert hasattr(forecasting_service, 'models'), "Forecasting service not working"
        logger.info("✓ Forecasting service: OK")
        
        # Test optimization service
        optimization_service = StockOptimizationService(forecasting_service)
        assert hasattr(optimization_service, 'safety_stock_multiplier'), "Optimization service not working"
        logger.info("✓ Optimization service: OK")
        
        # Test anomaly service
        anomaly_service = LSTMAnomalyService()
        assert hasattr(anomaly_service, 'autoencoders'), "Anomaly service not working"
        logger.info("✓ Anomaly detection service: OK")
        
        # Test routing service
        routing_service = RouteOptimizationService()
        assert hasattr(routing_service, 'vehicle_capacity'), "Routing service not working"
        logger.info("✓ Route optimization service: OK")
        
        logger.info("All services are running properly!")
        
    except Exception as e:
        logger.error(f"Service health check failed: {str(e)}")
        raise


async def main():
    """Main initialization function"""
    try:
        logger.info("Starting SupplyNet backend initialization...")
        
        # Check services
        await check_services()
        
        # Initialize sample data
        await initialize_sample_data()
        
        logger.info("SupplyNet backend initialization completed successfully!")
        logger.info("You can now start the API server with: uvicorn app.main:app --reload")
        
    except Exception as e:
        logger.error(f"Initialization failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
