import pandas as pd
import numpy as np
import requests
import yfinance as yf
from typing import List, Dict, Tuple, Optional, Union
import logging
from datetime import datetime, timedelta
import json
import os
from app.core.config import settings

logger = logging.getLogger(__name__)

class ProductionDataService:
    def __init__(self):
        self.data_sources = {
            'sales': [],
            'inventory': [],
            'external': []
        }
        self.data_cache = {}
        self.cache_ttl = 3600  # 1 hour cache
        
    def ingest_sales_data(self, data_source: str, **kwargs) -> Dict:
        """Ingest sales data from various sources"""
        try:
            if data_source == 'csv':
                return self._ingest_csv_sales(kwargs.get('file_path'))
            elif data_source == 'api':
                return self._ingest_api_sales(kwargs.get('api_url'), kwargs.get('api_key'))
            elif data_source == 'database':
                return self._ingest_database_sales(kwargs.get('connection_string'))
            elif data_source == 'excel':
                return self._ingest_excel_sales(kwargs.get('file_path'))
            else:
                raise ValueError(f"Unsupported data source: {data_source}")
        except Exception as e:
            logger.error(f"Error ingesting sales data from {data_source}: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "source": data_source
            }
    
    def _ingest_csv_sales(self, file_path: str) -> Dict:
        """Ingest sales data from CSV file"""
        try:
            df = pd.read_csv(file_path)
            
            # Validate required columns
            required_columns = ['date', 'warehouse_id', 'sku_id', 'units_sold']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return {
                    "status": "error",
                    "error": f"Missing required columns: {missing_columns}",
                    "source": "csv"
                }
            
            # Clean and standardize data
            df = self._clean_sales_data(df)
            
            # Convert to list of dictionaries
            sales_data = df.to_dict('records')
            
            return {
                "status": "success",
                "source": "csv",
                "data_count": len(sales_data),
                "date_range": {
                    "start": df['date'].min(),
                    "end": df['date'].max()
                },
                "warehouses": df['warehouse_id'].nunique(),
                "skus": df['sku_id'].nunique(),
                "data": sales_data
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": f"Error reading CSV file: {str(e)}",
                "source": "csv"
            }
    
    def _ingest_api_sales(self, api_url: str, api_key: str = None) -> Dict:
        """Ingest sales data from API"""
        try:
            headers = {}
            if api_key:
                headers['Authorization'] = f'Bearer {api_key}'
            
            response = requests.get(api_url, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Handle different API response formats
            if isinstance(data, list):
                sales_data = data
            elif isinstance(data, dict) and 'data' in data:
                sales_data = data['data']
            else:
                return {
                    "status": "error",
                    "error": "Unexpected API response format",
                    "source": "api"
                }
            
            # Convert to DataFrame for cleaning
            df = pd.DataFrame(sales_data)
            df = self._clean_sales_data(df)
            
            sales_data = df.to_dict('records')
            
            return {
                "status": "success",
                "source": "api",
                "data_count": len(sales_data),
                "date_range": {
                    "start": df['date'].min() if 'date' in df.columns else "unknown",
                    "end": df['date'].max() if 'date' in df.columns else "unknown"
                },
                "warehouses": df['warehouse_id'].nunique() if 'warehouse_id' in df.columns else 0,
                "skus": df['sku_id'].nunique() if 'sku_id' in df.columns else 0,
                "data": sales_data
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": f"Error fetching data from API: {str(e)}",
                "source": "api"
            }
    
    def _ingest_database_sales(self, connection_string: str) -> Dict:
        """Ingest sales data from database"""
        try:
            # This is a placeholder - in production you'd use SQLAlchemy or similar
            # For now, return an error indicating database connection is needed
            return {
                "status": "error",
                "error": "Database connection not implemented. Use CSV or API sources.",
                "source": "database"
            }
        except Exception as e:
            return {
                "status": "error",
                "error": f"Error connecting to database: {str(e)}",
                "source": "database"
            }
    
    def _ingest_excel_sales(self, file_path: str) -> Dict:
        """Ingest sales data from Excel file"""
        try:
            df = pd.read_excel(file_path)
            
            # Validate required columns
            required_columns = ['date', 'warehouse_id', 'sku_id', 'units_sold']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return {
                    "status": "error",
                    "error": f"Missing required columns: {missing_columns}",
                    "source": "excel"
                }
            
            # Clean and standardize data
            df = self._clean_sales_data(df)
            
            # Convert to list of dictionaries
            sales_data = df.to_dict('records')
            
            return {
                "status": "success",
                "source": "excel",
                "data_count": len(sales_data),
                "date_range": {
                    "start": df['date'].min(),
                    "end": df['date'].max()
                },
                "warehouses": df['warehouse_id'].nunique(),
                "skus": df['sku_id'].nunique(),
                "data": sales_data
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": f"Error reading Excel file: {str(e)}",
                "source": "excel"
            }
    
    def _clean_sales_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and standardize sales data"""
        # Convert date column to datetime
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
        
        # Remove rows with missing critical data
        df = df.dropna(subset=['warehouse_id', 'sku_id', 'units_sold'])
        
        # Ensure units_sold is numeric
        df['units_sold'] = pd.to_numeric(df['units_sold'], errors='coerce')
        df = df.dropna(subset=['units_sold'])
        
        # Remove negative sales (returns should be handled separately)
        df = df[df['units_sold'] >= 0]
        
        # Add missing columns if they don't exist
        if 'order_id' not in df.columns:
            df['order_id'] = [f"ORD-{i}" for i in range(len(df))]
        
        if 'client_id' not in df.columns:
            df['client_id'] = [f"CUST-{i}" for i in range(len(df))]
        
        # Add location data if missing (placeholder coordinates)
        if 'location_lat' not in df.columns:
            df['location_lat'] = 0.0
        if 'location_lng' not in df.columns:
            df['location_lng'] = 0.0
        
        # Sort by date
        df = df.sort_values('date')
        
        return df
    
    def get_external_market_data(self, symbols: List[str], period: str = "1y") -> Dict:
        """Fetch external market data for feature engineering"""
        try:
            market_data = {}
            
            for symbol in symbols:
                try:
                    ticker = yf.Ticker(symbol)
                    hist = ticker.history(period=period)
                    
                    if not hist.empty:
                        # Calculate technical indicators
                        hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
                        hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
                        hist['RSI'] = self._calculate_rsi(hist['Close'])
                        hist['Volatility'] = hist['Close'].rolling(window=20).std()
                        
                        market_data[symbol] = {
                            "status": "success",
                            "data": hist.to_dict('records'),
                            "last_price": float(hist['Close'].iloc[-1]),
                            "price_change": float(hist['Close'].iloc[-1] - hist['Close'].iloc[-2]),
                            "volume": int(hist['Volume'].iloc[-1])
                        }
                    else:
                        market_data[symbol] = {
                            "status": "error",
                            "error": "No data available"
                        }
                        
                except Exception as e:
                    market_data[symbol] = {
                        "status": "error",
                        "error": str(e)
                    }
            
            return {
                "status": "success",
                "market_data": market_data,
                "period": period
            }
            
        except Exception as e:
            logger.error(f"Error fetching market data: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate Relative Strength Index"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def generate_synthetic_training_data(self, warehouse_count: int = 5, sku_count: int = 20, days: int = 365) -> Dict:
        """Generate synthetic data for LSTM model training when real data is unavailable"""
        try:
            warehouses = [f"WH{i:03d}" for i in range(1, warehouse_count + 1)]
            skus = [f"SKU-{i:03d}" for i in range(1, sku_count + 1)]
            
            # Generate realistic sales patterns
            sales_data = []
            start_date = datetime.now() - timedelta(days=days)
            
            for day in range(days):
                current_date = start_date + timedelta(days=day)
                
                for warehouse in warehouses:
                    for sku in skus:
                        # Base demand with seasonality and trends
                        base_demand = np.random.poisson(25)  # Poisson distribution for realistic counts
                        
                        # Seasonal effects
                        seasonal_factor = 1 + 0.3 * np.sin(2 * np.pi * day / 365)
                        
                        # Weekly patterns
                        weekly_factor = 1.2 if current_date.weekday() < 5 else 0.8  # Weekday vs weekend
                        
                        # Random noise
                        noise = np.random.normal(0, 0.1)
                        
                        # Calculate final demand
                        demand = max(0, int(base_demand * seasonal_factor * weekly_factor * (1 + noise)))
                        
                        if demand > 0:
                            sales_data.append({
                                "date": current_date.strftime('%Y-%m-%d'),
                                "warehouse_id": warehouse,
                                "sku_id": sku,
                                "units_sold": demand,
                                "order_id": f"ORD-{current_date.strftime('%Y%m%d')}-{warehouse}-{sku}",
                                "client_id": f"CUST-{np.random.randint(1, 100):03d}",
                                "location_lat": np.random.uniform(30, 50),
                                "location_lng": np.random.uniform(-120, -70)
                            })
            
            return {
                "status": "success",
                "source": "synthetic",
                "data_count": len(sales_data),
                "date_range": {
                    "start": start_date.strftime('%Y-%m-%d'),
                    "end": datetime.now().strftime('%Y-%m-%d')
                },
                "warehouses": len(warehouses),
                "skus": len(skus),
                "data": sales_data,
                "note": "This is synthetic data for training purposes. Replace with real data in production."
            }
            
        except Exception as e:
            logger.error(f"Error generating synthetic data: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def validate_data_quality(self, sales_data: List[Dict]) -> Dict:
        """Validate data quality for LSTM training"""
        try:
            # Debug: Check first few records
            if sales_data and len(sales_data) > 0:
                logger.info(f"Validating {len(sales_data)} records")
                logger.info(f"First record sample: {sales_data[0]}")
            
            df = pd.DataFrame(sales_data)
            
            # Basic statistics - convert numpy types to Python native types
            total_records = int(len(df))
            missing_dates = int(df['date'].isna().sum())
            missing_warehouses = int(df['warehouse_id'].isna().sum())
            missing_skus = int(df['sku_id'].isna().sum())
            missing_sales = int(df['units_sold'].isna().sum())
            
            # Data quality metrics
            quality_score = 100
            issues = []
            
            if missing_dates > 0:
                quality_score -= 20
                issues.append(f"Missing dates: {missing_dates}")
            
            if missing_warehouses > 0:
                quality_score -= 20
                issues.append(f"Missing warehouse IDs: {missing_warehouses}")
            
            if missing_skus > 0:
                quality_score -= 20
                issues.append(f"Missing SKU IDs: {missing_skus}")
            
            if missing_sales > 0:
                quality_score -= 20
                issues.append(f"Missing sales data: {missing_sales}")
            
            # Check for sufficient data for LSTM training
            min_required = 100  # Minimum records for LSTM training
            if total_records < min_required:
                quality_score -= 30
                issues.append(f"Insufficient data: {total_records} records (minimum: {min_required})")
            
            # Check date range with better error handling
            if 'date' in df.columns:
                try:
                    # Handle date conversion more carefully
                    df['date'] = pd.to_datetime(df['date'], errors='coerce')
                    valid_dates = df['date'].notna()
                    invalid_dates = int((~valid_dates).sum())
                    
                    if invalid_dates > 0:
                        quality_score -= 15
                        issues.append(f"Invalid date formats: {invalid_dates}")
                        logger.warning(f"Found {invalid_dates} invalid dates")
                    
                    # Only calculate range if we have valid dates
                    if int(valid_dates.sum()) > 0:
                        valid_date_df = df[valid_dates]
                        date_range = int((valid_date_df['date'].max() - valid_date_df['date'].min()).days)
                        if date_range < 30:
                            quality_score -= 20
                            issues.append(f"Limited date range: {date_range} days (recommended: 30+ days)")
                    else:
                        quality_score -= 25
                        issues.append("No valid dates found")
                        
                except Exception as date_error:
                    logger.error(f"Error processing dates: {date_error}")
                    quality_score -= 25
                    issues.append(f"Date processing error: {str(date_error)}")
            
            quality_score = max(0, quality_score)
            
            return {
                "status": "success",
                "quality_score": quality_score,
                "total_records": total_records,
                "missing_data": {
                    "dates": missing_dates,
                    "warehouses": missing_warehouses,
                    "skus": missing_skus,
                    "sales": missing_sales
                },
                "issues": issues,
                "recommendations": self._get_quality_recommendations(quality_score, issues)
            }
            
        except Exception as e:
            logger.error(f"Error in validate_data_quality: {str(e)}")
            logger.error(f"Sales data type: {type(sales_data)}")
            if sales_data and len(sales_data) > 0:
                logger.error(f"First record type: {type(sales_data[0])}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _get_quality_recommendations(self, quality_score: int, issues: List[str]) -> List[str]:
        """Get recommendations based on data quality score"""
        recommendations = []
        
        if quality_score < 50:
            recommendations.append("Data quality is poor. Clean data before training models.")
        elif quality_score < 80:
            recommendations.append("Data quality is acceptable but could be improved.")
        else:
            recommendations.append("Data quality is good for model training.")
        
        if "Insufficient data" in str(issues):
            recommendations.append("Collect more data or use data augmentation techniques.")
        
        if "Limited date range" in str(issues):
            recommendations.append("Extend data collection period for better seasonality modeling.")
        
        if "Missing data" in str(issues):
            recommendations.append("Implement data imputation strategies for missing values.")
        
        return recommendations

# Alias for backward compatibility
DataProcessingService = ProductionDataService
