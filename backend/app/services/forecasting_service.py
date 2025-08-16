import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error, mean_absolute_error
from typing import List, Dict, Tuple, Optional, Union
import logging
from datetime import datetime, timedelta
import joblib
import os
import json
from app.core.config import settings

logger = logging.getLogger(__name__)

# Import PyTorch for LSTM models
try:
    import torch
    import torch.nn as nn
    PYTORCH_AVAILABLE = True
    logger.info("PyTorch loaded successfully")
except ImportError as e:
    logger.error(f"PyTorch not available: {e}")
    PYTORCH_AVAILABLE = False

class LSTMForecastingService:
    def __init__(self):
        self.models: Dict[str, any] = {}
        self.scalers: Dict[str, MinMaxScaler] = {}
        self.model_metrics: Dict[str, Dict] = {}
        # Use absolute paths for model storage
        current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        self.models_dir = os.path.join(current_dir, "models")
        self.scalers_dir = os.path.join(current_dir, "scalers")
        self.metrics_dir = os.path.join(current_dir, "metrics")
        
        # Create directories
        for directory in [self.models_dir, self.scalers_dir, self.metrics_dir]:
            os.makedirs(directory, exist_ok=True)
        
        # LSTM hyperparameters
        self.sequence_length = 30  # Look back period
        self.feature_columns = ['units_sold', 'day_of_week', 'month', 'quarter', 'is_weekend', 'is_holiday']
        
        if not PYTORCH_AVAILABLE:
            logger.error("PyTorch not available. LSTM models will not work.")
        
    def prepare_data_for_lstm(self, sales_data: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Convert sales data to LSTM format with engineered features"""
        df = pd.DataFrame(sales_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Feature engineering
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['quarter'] = df['date'].dt.quarter
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_holiday'] = self._is_holiday(df['date']).astype(int)
        
        # Group by date and aggregate
        daily_data = df.groupby('date').agg({
            'units_sold': 'sum',
            'day_of_week': 'first',
            'month': 'first',
            'quarter': 'first',
            'is_weekend': 'first',
            'is_holiday': 'first'
        }).reset_index()
        
        # Fill missing dates
        date_range = pd.date_range(start=daily_data['date'].min(), end=daily_data['date'].max(), freq='D')
        daily_data = daily_data.set_index('date').reindex(date_range, fill_value=0).reset_index()
        
        # Prepare features and target
        features = daily_data[self.feature_columns].values
        target = daily_data['units_sold'].values
        
        # Create sequences for LSTM
        X, y = [], []
        for i in range(self.sequence_length, len(features)):
            X.append(features[i-self.sequence_length:i])
            y.append(target[i])
        
        return np.array(X), np.array(y)
    
    def _is_holiday(self, dates: pd.Series) -> pd.Series:
        """Simple holiday detection (can be enhanced with external holiday APIs)"""
        holidays = []
        for date in dates:
            # Major US holidays (simplified)
            month, day = date.month, date.day
            is_holiday = (
                (month == 1 and day == 1) or  # New Year
                (month == 7 and day == 4) or  # Independence Day
                (month == 12 and day == 25)   # Christmas
            )
            holidays.append(is_holiday)
        return pd.Series(holidays)
    
    def create_lstm_model(self, input_shape: Tuple[int, int]):
        """Create a production-ready LSTM model using PyTorch"""
        if PYTORCH_AVAILABLE:
            return self._create_pytorch_model(input_shape)
        else:
            raise RuntimeError("PyTorch not available")
    

    
    def _create_pytorch_model(self, input_shape: Tuple[int, int]):
        """Create LSTM model using PyTorch"""
        class LSTMModel(nn.Module):
            def __init__(self, input_size, hidden_size=128, num_layers=2):
                super(LSTMModel, self).__init__()
                self.hidden_size = hidden_size
                self.num_layers = num_layers
                
                self.lstm = nn.LSTM(input_size, hidden_size, num_layers, 
                                   batch_first=True, dropout=0.2)
                self.fc1 = nn.Linear(hidden_size, 32)
                self.fc2 = nn.Linear(32, 16)
                self.fc3 = nn.Linear(16, 1)
                self.dropout = nn.Dropout(0.2)
                self.relu = nn.ReLU()
                
            def forward(self, x):
                h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
                c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
                
                out, _ = self.lstm(x, (h0, c0))
                out = self.dropout(out[:, -1, :])
                out = self.relu(self.fc1(out))
                out = self.dropout(out)
                out = self.relu(self.fc2(out))
                out = self.fc3(out)
                return out
        
        model = LSTMModel(input_shape[1])
        return model
    
    def train_model(self, warehouse_id: str, sku_id: str, sales_data: List[Dict]) -> Dict:
        """Train an LSTM model for a specific warehouse-SKU combination"""
        try:
            if not PYTORCH_AVAILABLE:
                return {
                    "status": "error",
                    "error": "PyTorch not available. Please install PyTorch."
                }
            
            # Prepare data
            X, y = self.prepare_data_for_lstm(sales_data)
            
            if len(X) < 50:  # Need sufficient data for training
                raise ValueError(f"Insufficient data for {warehouse_id}-{sku_id}: {len(X)} sequences")
            
            # Split data
            split_idx = int(len(X) * 0.8)
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]
            
            # Scale features
            scaler = MinMaxScaler()
            X_train_scaled = scaler.fit_transform(X_train.reshape(-1, X_train.shape[-1])).reshape(X_train.shape)
            X_test_scaled = scaler.transform(X_test.reshape(-1, X_test.shape[-1])).reshape(X_test.shape)
            
            # Create and train model
            model = self.create_lstm_model((X_train.shape[1], X_train.shape[2]))
            
            training_result = self._train_pytorch_model(model, X_train_scaled, y_train, X_test_scaled, y_test)
            
            if training_result['status'] == 'success':
                # Store model and scaler
                model_key = f"{warehouse_id}_{sku_id}"
                self.models[model_key] = training_result['model']
                self.scalers[model_key] = scaler
                self.model_metrics[model_key] = training_result['metrics']
                
                # Save model and scaler
                self._save_model(model_key, training_result['model'], scaler, training_result['metrics'])
                
                logger.info(f"LSTM model trained successfully for {model_key}")
                return {
                    "status": "success",
                    "model_key": model_key,
                    "metrics": training_result['metrics'],
                    "data_points": len(X),
                    "framework": "PyTorch"
                }
            else:
                return training_result
            
        except Exception as e:
            logger.error(f"Error training LSTM model for {warehouse_id}-{sku_id}: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
    

    
    def _train_pytorch_model(self, model, X_train, y_train, X_test, y_test):
        """Train PyTorch model"""
        try:
            # Convert to PyTorch tensors
            X_train_tensor = torch.FloatTensor(X_train)
            y_train_tensor = torch.FloatTensor(y_train)
            X_test_tensor = torch.FloatTensor(X_test)
            y_test_tensor = torch.FloatTensor(y_test)
            
            # Training parameters
            criterion = nn.MSELoss()
            optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
            
            # Training loop
            model.train()
            for epoch in range(100):
                optimizer.zero_grad()
                outputs = model(X_train_tensor)
                loss = criterion(outputs.squeeze(), y_train_tensor)
                loss.backward()
                optimizer.step()
                
                if epoch % 20 == 0:
                    logger.info(f"Epoch {epoch}, Loss: {loss.item():.4f}")
            
            # Evaluate model
            model.eval()
            with torch.no_grad():
                y_pred = model(X_test_tensor).squeeze().numpy()
            
            metrics = self._evaluate_model(y_test, y_pred)
            
            return {
                "status": "success",
                "model": model,
                "metrics": metrics
            }
        except Exception as e:
            return {
                "status": "error",
                "error": f"PyTorch training failed: {str(e)}"
            }
    
    def generate_forecast(self, warehouse_id: str, sku_id: str, horizon_days: int = 7) -> Dict:
        """Generate forecast using trained LSTM model"""
        try:
            model_key = f"{warehouse_id}_{sku_id}"
            
            # Load model if not in memory
            if model_key not in self.models:
                self._load_model(model_key)
            
            if model_key not in self.models:
                raise ValueError(f"No trained model found for {model_key}")
            
            model = self.models[model_key]
            scaler = self.scalers[model_key]
            
            # Get recent data for prediction
            recent_data = self._get_recent_data(warehouse_id, sku_id)
            if len(recent_data) < self.sequence_length:
                raise ValueError(f"Insufficient recent data for prediction")
            
            # Prepare recent sequence
            recent_features = self._extract_features(recent_data[-self.sequence_length:])
            recent_scaled = scaler.transform(recent_features.reshape(-1, recent_features.shape[-1]))
            recent_sequence = recent_scaled.reshape(1, self.sequence_length, -1)
            
            # Generate predictions
            forecast_data = []
            current_sequence = recent_sequence.copy()
            
            for day in range(horizon_days):
                # Predict next value
                with torch.no_grad():
                    prediction = model(torch.FloatTensor(current_sequence)).item()
                
                # Create forecast entry
                forecast_date = datetime.now() + timedelta(days=day+1)
                forecast_data.append({
                    "date": forecast_date.strftime('%Y-%m-%d'),
                    "predicted_demand": max(0, round(prediction)),
                    "confidence_lower": max(0, round(prediction * 0.8)),
                    "confidence_upper": round(prediction * 1.2),
                    "model_confidence": self._calculate_confidence(prediction, day)
                })
                
                # Update sequence for next prediction
                if day < horizon_days - 1:
                    # Create next feature vector (simplified - in production you'd get actual data)
                    next_features = self._create_next_features(forecast_date, prediction)
                    next_scaled = scaler.transform(next_features.reshape(-1, -1))
                    
                    # Update sequence
                    current_sequence = np.roll(current_sequence, -1, axis=1)
                    current_sequence[0, -1] = next_scaled[0]
            
            return {
                "status": "success",
                "warehouse_id": warehouse_id,
                "sku_id": sku_id,
                "forecast_data": forecast_data,
                "model_metrics": self.model_metrics.get(model_key, {}),
                "prediction_method": "LSTM",
                "framework": "PyTorch",
                "last_training": self._get_last_training_date(model_key)
            }
            
        except Exception as e:
            logger.error(f"Error generating forecast for {warehouse_id}-{sku_id}: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _get_recent_data(self, warehouse_id: str, sku_id: str) -> List[Dict]:
        """Get recent sales data for prediction from data files"""
        try:
            # Try to load from data directory
            current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            data_dir = os.path.join(current_dir, "data")
            data_file = os.path.join(data_dir, f"{warehouse_id}_{sku_id}_sales.json")
            
            if os.path.exists(data_file):
                with open(data_file, 'r') as f:
                    data = json.load(f)
                    # Return last 30 days of data for prediction
                    if len(data) > 30:
                        return data[-30:]
                    return data
            
            # If no data file, return empty list
            return []
            
        except Exception as e:
            logger.error(f"Error loading recent data for {warehouse_id}-{sku_id}: {str(e)}")
            return []
    
    def _extract_features(self, data: List[Dict]) -> np.ndarray:
        """Extract features from sales data"""
        features = []
        for item in data:
            date = pd.to_datetime(item['date'])
            features.append([
                item['units_sold'],
                date.dayofweek,
                date.month,
                date.quarter,
                1 if date.dayofweek in [5, 6] else 0,
                1 if self._is_holiday(pd.Series([date]))[0] else 0
            ])
        return np.array(features)
    
    def _create_next_features(self, date: datetime, predicted_sales: float) -> np.ndarray:
        """Create feature vector for next day"""
        return np.array([[
            predicted_sales,
            date.dayofweek,
            date.month,
            date.quarter,
            1 if date.dayofweek in [5, 6] else 0,
            1 if self._is_holiday(pd.Series([date]))[0] else 0
        ]])
    
    def _calculate_confidence(self, prediction: float, days_ahead: int) -> float:
        """Calculate confidence based on prediction horizon"""
        # Confidence decreases with time
        base_confidence = 0.85
        decay_factor = 0.05
        return max(0.5, base_confidence - (days_ahead * decay_factor))
    
    def _evaluate_model(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
        """Evaluate model performance"""
        mape = mean_absolute_percentage_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        mae = mean_absolute_error(y_true, y_pred)
        
        return {
            "mape": round(mape * 100, 2),
            "rmse": round(rmse, 2),
            "mae": round(mae, 2),
            "r2_score": round(1 - (np.sum((y_true - y_pred) ** 2) / np.sum((y_true - np.mean(y_true)) ** 2)), 3)
        }
    
    def _save_model(self, model_key: str, model: any, scaler: MinMaxScaler, metrics: Dict):
        """Save model, scaler, and metrics"""
        try:
            # Save model
            model_path = os.path.join(self.models_dir, f"{model_key}.pth")
            torch.save(model.state_dict(), model_path)
            
            # Save scaler
            scaler_path = os.path.join(self.scalers_dir, f"{model_key}_scaler.joblib")
            joblib.dump(scaler, scaler_path)
            
            # Save metrics
            metrics_path = os.path.join(self.metrics_dir, f"{model_key}_metrics.json")
            with open(metrics_path, 'w') as f:
                json.dump(metrics, f)
                
            logger.info(f"Model components saved for {model_key}")
        except Exception as e:
            logger.error(f"Error saving model components for {model_key}: {str(e)}")
    
    def _load_model(self, model_key: str):
        """Load model, scaler, and metrics"""
        try:
            # Load model
            model_path = os.path.join(self.models_dir, f"{model_key}.pth")
            if os.path.exists(model_path):
                # Recreate model architecture and load weights
                model = self.create_lstm_model((self.sequence_length, len(self.feature_columns)))
                model.load_state_dict(torch.load(model_path))
                self.models[model_key] = model
            
            # Load scaler
            scaler_path = os.path.join(self.scalers_dir, f"{model_key}_scaler.joblib")
            if os.path.exists(scaler_path):
                scaler = joblib.load(scaler_path)
                self.scalers[model_key] = scaler
            
            # Load metrics
            metrics_path = os.path.join(self.metrics_dir, f"{model_key}_metrics.json")
            if os.path.exists(metrics_path):
                with open(metrics_path, 'r') as f:
                    metrics = json.load(f)
                    self.model_metrics[model_key] = metrics
                    
            logger.info(f"Model components loaded for {model_key}")
        except Exception as e:
            logger.error(f"Error loading model components for {model_key}: {str(e)}")
    
    def _get_last_training_date(self, model_key: str) -> Optional[str]:
        """Get last training date for a model"""
        model_path = os.path.join(self.models_dir, f"{model_key}.pth")
            
        if os.path.exists(model_path):
            return datetime.fromtimestamp(os.path.getmtime(model_path)).isoformat()
        return None
    
    def get_model_status(self, warehouse_id: str, sku_id: str) -> Dict:
        """Get status of a specific model"""
        model_key = f"{warehouse_id}_{sku_id}"
        
        if model_key in self.models:
            return {
                "status": "loaded",
                "metrics": self.model_metrics.get(model_key, {}),
                "last_updated": self._get_last_training_date(model_key),
                "model_type": "LSTM",
                "framework": "PyTorch"
            }
        else:
            # Check if model exists on disk
            model_path = os.path.join(self.models_dir, f"{model_key}.pth")
                
            if os.path.exists(model_path):
                return {
                    "status": "saved",
                    "last_updated": self._get_last_training_date(model_key),
                    "model_type": "LSTM",
                    "framework": "PyTorch"
                }
            else:
                return {
                    "status": "not_found",
                    "model_type": "LSTM",
                    "framework": "PyTorch"
                }
    
    def retrain_all_models(self, sales_data: List[Dict]) -> Dict:
        """Retrain all models with new data"""
        results = {}
        
        # Group data by warehouse and SKU
        df = pd.DataFrame(sales_data)
        grouped = df.groupby(['warehouse_id', 'sku_id'])
        
        for (warehouse_id, sku_id), group_data in grouped:
            group_list = group_data.to_dict('records')
            result = self.train_model(warehouse_id, sku_id, group_list)
            results[f"{warehouse_id}_{sku_id}"] = result
        
        return results
    
    def get_model_performance_summary(self) -> Dict:
        """Get summary of all model performances"""
        summary = {
            "total_models": len(self.model_metrics),
            "average_mape": 0,
            "average_rmse": 0,
            "best_performing": None,
            "worst_performing": None,
            "framework": "PyTorch"
        }
        
        if self.model_metrics:
            mape_values = [m['mape'] for m in self.model_metrics.values() if m.get('mape')]
            rmse_values = [m['rmse'] for m in self.model_metrics.values() if m.get('rmse')]
            
            if mape_values:
                summary["average_mape"] = round(np.mean(mape_values), 2)
                summary["average_rmse"] = round(np.mean(rmse_values), 2)
                
                # Find best and worst performing models
                best_model = min(self.model_metrics.items(), key=lambda x: x[1].get('mape', float('inf')))
                worst_model = max(self.model_metrics.items(), key=lambda x: x[1].get('mape', 0))
                
                summary["best_performing"] = {
                    "model_key": best_model[0],
                    "mape": best_model[1].get('mape')
                }
                summary["worst_performing"] = {
                    "model_key": worst_model[0],
                    "mape": worst_model[1].get('mape')
                }
        
        return summary

# Alias for backward compatibility
ForecastingService = LSTMForecastingService
