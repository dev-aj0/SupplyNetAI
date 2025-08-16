import os
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
import pickle
import joblib
from sklearn.preprocessing import MinMaxScaler

# Import PyTorch for LSTM models
try:
    import torch
    import torch.nn as nn
    PYTORCH_AVAILABLE = True
except ImportError as e:
    PYTORCH_AVAILABLE = False

logger = logging.getLogger(__name__)

if PYTORCH_AVAILABLE:
    logger.info("PyTorch loaded successfully for anomaly detection")
else:
    logger.error(f"PyTorch not available: {e}")

class LSTMAnomalyService:
    """LSTM-based anomaly detection service using PyTorch"""
    
    def __init__(self):
        # Use absolute paths for model storage
        current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        self.models_dir = os.path.join(current_dir, "models", "anomaly_models")
        self.scalers_dir = os.path.join(current_dir, "scalers", "anomaly_scalers")
        self.thresholds_dir = os.path.join(current_dir, "metrics", "anomaly_thresholds")
        self.metrics_dir = os.path.join(current_dir, "metrics")
        
        # Create directories if they don't exist
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.scalers_dir, exist_ok=True)
        os.makedirs(self.thresholds_dir, exist_ok=True)
        os.makedirs(self.metrics_dir, exist_ok=True)
        
        # Storage for models and components
        self.autoencoders = {}
        self.scalers = {}
        self.thresholds = {}
        self.anomaly_metrics = {}
        
        logger.info("LSTM Anomaly Service initialized")
    
    def create_autoencoder(self, input_shape: Tuple[int, int]):
        """Create an LSTM autoencoder for anomaly detection"""
        if not PYTORCH_AVAILABLE:
            raise RuntimeError("PyTorch not available")
        
        return self._create_pytorch_autoencoder(input_shape)
    
    def _create_pytorch_autoencoder(self, input_shape: Tuple[int, int]):
        """Create LSTM autoencoder using PyTorch"""
        class LSTMAutoencoder(nn.Module):
            def __init__(self, input_size, hidden_size=64, latent_size=16):
                super(LSTMAutoencoder, self).__init__()
                self.hidden_size = hidden_size
                self.latent_size = latent_size
                
                # Encoder
                self.encoder_lstm1 = nn.LSTM(input_size, hidden_size, batch_first=True, dropout=0.2)
                self.encoder_lstm2 = nn.LSTM(hidden_size, hidden_size//2, batch_first=True, dropout=0.2)
                self.encoder_fc = nn.Linear(hidden_size//2, latent_size)
                
                # Decoder
                self.decoder_fc = nn.Linear(latent_size, hidden_size//2)
                self.decoder_lstm1 = nn.LSTM(hidden_size//2, hidden_size, batch_first=True, dropout=0.2)
                self.decoder_lstm2 = nn.LSTM(hidden_size, input_size, batch_first=True, dropout=0.2)
                
                self.relu = nn.ReLU()
                
            def forward(self, x):
                # Encode
                encoded, _ = self.encoder_lstm1(x)
                encoded, _ = self.encoder_lstm2(encoded)
                encoded = self.relu(self.encoder_fc(encoded[:, -1, :]))
                
                # Decode
                decoded = self.relu(self.decoder_fc(encoded))
                decoded = decoded.unsqueeze(1).repeat(1, x.size(1), 1)
                decoded, _ = self.decoder_lstm1(decoded)
                decoded, _ = self.decoder_lstm2(decoded)
                
                return decoded
        
        autoencoder = LSTMAutoencoder(input_shape[1])
        return autoencoder
    
    def train_anomaly_detector(self, warehouse_id: str, sku_id: str, sales_data: List[Dict]) -> Dict:
        """Train an LSTM autoencoder for anomaly detection"""
        try:
            if not PYTORCH_AVAILABLE:
                return {
                    "status": "error",
                    "error": "PyTorch not available. Please install PyTorch."
                }
            
            # Prepare data
            sequences = self.prepare_data_for_autoencoder(sales_data)
            
            if len(sequences) < 50:  # Need sufficient data for training
                raise ValueError(f"Insufficient data for {warehouse_id}-{sku_id}: {len(sequences)} sequences")
            
            # Split data
            split_idx = int(len(sequences) * 0.8)
            train_sequences = sequences[:split_idx]
            test_sequences = sequences[split_idx:]
            
            # Scale features
            scaler = MinMaxScaler()
            train_scaled = scaler.fit_transform(train_sequences.reshape(-1, train_sequences.shape[-1])).reshape(train_sequences.shape)
            test_scaled = scaler.transform(test_sequences.reshape(-1, test_sequences.shape[-1])).reshape(test_sequences.shape)
            
            # Create and train autoencoder
            autoencoder = self.create_autoencoder((train_sequences.shape[1], train_sequences.shape[2]))
            
            training_result = self._train_pytorch_autoencoder(autoencoder, train_scaled, test_scaled)
            
            if training_result['status'] == 'success':
                # Calculate threshold based on reconstruction error
                threshold = self._calculate_threshold(autoencoder, test_scaled, scaler)
                
                # Store components
                model_key = f"{warehouse_id}_{sku_id}"
                self.autoencoders[model_key] = autoencoder
                self.scalers[model_key] = scaler
                self.thresholds[model_key] = threshold
                self.anomaly_metrics[model_key] = training_result['metrics']
                
                # Save components
                self._save_anomaly_detector(model_key, autoencoder, scaler, threshold, training_result['metrics'])
                
                logger.info(f"LSTM anomaly detector trained successfully for {model_key}")
                return {
                    "status": "success",
                    "model_key": model_key,
                    "threshold": threshold,
                    "metrics": training_result['metrics'],
                    "data_points": len(sequences),
                    "framework": "PyTorch"
                }
            else:
                return training_result
            
        except Exception as e:
            logger.error(f"Error training anomaly detector for {warehouse_id}-{sku_id}: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _train_pytorch_autoencoder(self, autoencoder, train_sequences, test_sequences):
        """Train PyTorch autoencoder"""
        try:
            # Convert to PyTorch tensors
            train_tensor = torch.FloatTensor(train_sequences)
            test_tensor = torch.FloatTensor(test_sequences)
            
            # Training parameters
            criterion = nn.MSELoss()
            optimizer = torch.optim.Adam(autoencoder.parameters(), lr=0.001)
            
            # Training loop
            autoencoder.train()
            for epoch in range(100):
                optimizer.zero_grad()
                reconstructed = autoencoder(train_tensor)
                loss = criterion(reconstructed, train_tensor)
                loss.backward()
                optimizer.step()
                
                if epoch % 20 == 0:
                    logger.info(f"Epoch {epoch}, Loss: {loss.item():.6f}")
            
            # Evaluate
            autoencoder.eval()
            with torch.no_grad():
                train_reconstruction = autoencoder(train_tensor)
                test_reconstruction = autoencoder(test_tensor)
            
            train_mse = torch.mean((train_tensor - train_reconstruction) ** 2).item()
            test_mse = torch.mean((test_tensor - test_reconstruction) ** 2).item()
            
            metrics = {
                "train_reconstruction_error": float(train_mse),
                "test_reconstruction_error": float(test_mse),
                "final_loss": float(loss.item())
            }
            
            return {
                "status": "success",
                "autoencoder": autoencoder,
                "metrics": metrics
            }
        except Exception as e:
            return {
                "status": "error",
                "error": f"PyTorch autoencoder training failed: {str(e)}"
            }
    
    def prepare_data_for_autoencoder(self, sales_data: List[Dict]) -> np.ndarray:
        """Prepare sales data for LSTM autoencoder"""
        try:
            # Convert to DataFrame
            df = pd.DataFrame(sales_data)
            
            # Ensure date column is datetime
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Create features
            df['day_of_week'] = df['date'].dt.dayofweek
            df['month'] = df['date'].dt.month
            df['quarter'] = df['date'].dt.quarter
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
            
            # Select features for the model
            feature_columns = ['units_sold', 'day_of_week', 'month', 'quarter', 'is_weekend']
            features = df[feature_columns].values
            
            # Create sequences (lookback of 7 days)
            sequences = []
            lookback = 7
            
            for i in range(lookback, len(features)):
                sequences.append(features[i-lookback:i])
            
            return np.array(sequences)
            
        except Exception as e:
            logger.error(f"Error preparing data for autoencoder: {str(e)}")
            raise
    
    def _calculate_threshold(self, autoencoder, test_sequences, scaler):
        """Calculate anomaly threshold based on reconstruction error"""
        try:
            autoencoder.eval()
            with torch.no_grad():
                test_tensor = torch.FloatTensor(test_sequences)
                reconstructed = autoencoder(test_tensor)
                reconstruction_errors = torch.mean((test_tensor - reconstructed) ** 2, dim=(1, 2))
                
                # Use 95th percentile as threshold
                threshold = torch.quantile(reconstruction_errors, 0.95).item()
                return threshold
                
        except Exception as e:
            logger.error(f"Error calculating threshold: {str(e)}")
            return 0.1  # Default threshold
    
    def _save_anomaly_detector(self, model_key: str, autoencoder, scaler, threshold, metrics):
        """Save trained anomaly detector components"""
        try:
            # Save PyTorch model
            model_path = os.path.join(self.models_dir, f"{model_key}_autoencoder.pth")
            torch.save(autoencoder.state_dict(), model_path)
            
            # Save scaler
            scaler_path = os.path.join(self.scalers_dir, f"{model_key}_scaler.joblib")
            joblib.dump(scaler, scaler_path)
            
            # Save threshold
            threshold_path = os.path.join(self.thresholds_dir, f"{model_key}_threshold.pkl")
            with open(threshold_path, 'wb') as f:
                pickle.dump(threshold, f)
            
            # Save metrics
            metrics_path = os.path.join(self.metrics_dir, f"{model_key}_metrics.json")
            import json
            with open(metrics_path, 'w') as f:
                json.dump(metrics, f, indent=2)
            
            logger.info(f"Anomaly detector components saved for {model_key}")
            
        except Exception as e:
            logger.error(f"Error saving anomaly detector for {model_key}: {str(e)}")
    
    def detect_anomalies(self, warehouse_id: str, sku_id: str, sales_data: List[Dict]) -> Dict:
        """Detect anomalies in sales data using trained LSTM autoencoder"""
        try:
            model_key = f"{warehouse_id}_{sku_id}"
            
            if model_key not in self.autoencoders:
                return {
                    "status": "error",
                    "error": f"No trained model found for {warehouse_id}-{sku_id}"
                }
            
            # Prepare data
            sequences = self.prepare_data_for_autoencoder(sales_data)
            
            if len(sequences) == 0:
                return {
                    "status": "error",
                    "error": "No valid sequences found in data"
                }
            
            # Scale data
            scaler = self.scalers[model_key]
            scaled_sequences = scaler.transform(sequences.reshape(-1, sequences.shape[-1])).reshape(sequences.shape)
            
            # Get predictions
            autoencoder = self.autoencoders[model_key]
            threshold = self.thresholds[model_key]
            
            autoencoder.eval()
            with torch.no_grad():
                sequences_tensor = torch.FloatTensor(scaled_sequences)
                reconstructed = autoencoder(sequences_tensor)
                reconstruction_errors = torch.mean((sequences_tensor - reconstructed) ** 2, dim=(1, 2))
                
                # Detect anomalies
                anomalies = (reconstruction_errors > threshold).numpy()
                
                # Get anomaly scores
                anomaly_scores = reconstruction_errors.numpy()
            
            # Prepare results
            anomaly_results = []
            for i, (is_anomaly, score) in enumerate(zip(anomalies, anomaly_scores)):
                if is_anomaly:
                    anomaly_results.append({
                        "sequence_index": i,
                        "anomaly_score": float(score),
                        "threshold": float(threshold),
                        "severity": "high" if score > threshold * 1.5 else "medium"
                    })
            
            return {
                "status": "success",
                "anomalies_detected": len(anomaly_results),
                "total_sequences": len(sequences),
                "anomaly_rate": len(anomaly_results) / len(sequences),
                "anomaly_details": anomaly_results,
                "threshold": float(threshold),
                "framework": "PyTorch"
            }
            
        except Exception as e:
            logger.error(f"Error detecting anomalies for {warehouse_id}-{sku_id}: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def get_model_status(self, warehouse_id: str, sku_id: str) -> Dict:
        """Get status of a specific anomaly detection model"""
        try:
            model_key = f"{warehouse_id}_{sku_id}"
            
            if model_key in self.autoencoders:
                return {
                    "status": "trained",
                    "warehouse_id": warehouse_id,
                    "sku_id": sku_id,
                    "model_loaded": True,
                    "threshold": self.thresholds.get(model_key, None),
                    "metrics": self.anomaly_metrics.get(model_key, {}),
                    "framework": "PyTorch"
                }
            else:
                return {
                    "status": "not_trained",
                    "warehouse_id": warehouse_id,
                    "sku_id": sku_id,
                    "model_loaded": False,
                    "framework": "PyTorch"
                }
                
        except Exception as e:
            logger.error(f"Error getting model status for {warehouse_id}-{sku_id}: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
