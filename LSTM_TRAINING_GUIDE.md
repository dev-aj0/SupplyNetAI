# LSTM Training Guide for SupplyNet

## Overview
This guide covers how to train production-ready LSTM models for demand forecasting and anomaly detection in your supply chain system.

## 1. Data Requirements

### Minimum Data Requirements
- **Time Series Length**: At least 100 days of historical data
- **Data Points**: Minimum 1000 records for reliable training
- **Data Quality**: <5% missing values, consistent format
- **Update Frequency**: Daily data updates recommended

### Required Data Fields
```json
{
  "date": "YYYY-MM-DD",
  "warehouse_id": "string",
  "sku_id": "string", 
  "units_sold": "numeric",
  "order_id": "string",
  "client_id": "string",
  "location_lat": "numeric",
  "location_lng": "numeric"
}
```

## 2. Recommended Datasets

### A. Internal Company Data (Best Option)
- **Sales Transaction Data**: Daily sales records from your ERP/WMS
- **Inventory Movement**: Stock in/out transactions
- **Purchase Orders**: Historical procurement data
- **Customer Orders**: Order fulfillment data

### B. Public Supply Chain Datasets
1. **Kaggle Supply Chain Datasets**
   - [Supply Chain Analytics](https://www.kaggle.com/datasets/roshansharma/amazon-supply-chain-analytics)
   - [Retail Sales Dataset](https://www.kaggle.com/datasets/mathchi/retail-sales-dataset)

2. **UCI Machine Learning Repository**
   - [Online Retail Dataset](https://archive.ics.uci.edu/ml/datasets/Online+Retail)

3. **Amazon Public Datasets**
   - [Amazon Customer Behavior](https://registry.opendata.aws/amazon-customer-behavior/)

### C. Synthetic Data Generation
When real data is unavailable, use our built-in synthetic data generator:
```python
# Generate 1 year of synthetic data for 5 warehouses and 20 SKUs
synthetic_data = data_service.generate_synthetic_training_data(
    warehouse_count=5,
    sku_count=20, 
    days=365
)
```

## 3. Data Preparation

### A. Data Cleaning
```python
# Validate data quality
quality_report = data_service.validate_data_quality(sales_data)

# Clean data if needed
if quality_report['quality_score'] < 80:
    print("Data quality issues detected:")
    for issue in quality_report['issues']:
        print(f"- {issue}")
```

### B. Feature Engineering
Our LSTM models automatically create these features:
- **Temporal Features**: day_of_week, month, quarter
- **Business Features**: is_weekend, is_holiday
- **Sequential Features**: 30-day lookback window

### C. Data Splitting
- **Training**: 80% of data
- **Validation**: 20% of data
- **Test**: Use recent data for final evaluation

## 4. Model Training

### A. Training Individual Models
```python
# Train forecasting model for specific warehouse-SKU combination
forecast_result = forecasting_service.train_model(
    warehouse_id="WH001",
    sku_id="SKU-001", 
    sales_data=sales_data
)

# Train anomaly detector
anomaly_result = anomaly_service.train_anomaly_detector(
    warehouse_id="WH001",
    sku_id="SKU-001",
    sales_data=sales_data
)
```

### B. Batch Training
```python
# Train all models at once
forecast_results = forecasting_service.retrain_all_models(sales_data)
anomaly_results = anomaly_service.retrain_all_detectors(sales_data)
```

### C. Training Parameters
- **Epochs**: 100 (with early stopping)
- **Batch Size**: 32
- **Learning Rate**: 0.001 (with reduction on plateau)
- **Sequence Length**: 30 days
- **Validation Split**: 20%

## 5. Model Evaluation

### A. Forecasting Metrics
- **MAPE**: Mean Absolute Percentage Error (target: <15%)
- **RMSE**: Root Mean Square Error
- **MAE**: Mean Absolute Error
- **R² Score**: Coefficient of determination (target: >0.7)

### B. Anomaly Detection Metrics
- **Reconstruction Error**: Lower is better
- **Threshold**: Mean + 2*Std of training errors
- **Anomaly Score**: 0-1 scale (higher = more anomalous)

### C. Performance Monitoring
```python
# Get model performance summary
performance = forecasting_service.get_model_performance_summary()
print(f"Average MAPE: {performance['average_mape']}%")
print(f"Best Model: {performance['best_performing']['model_key']}")
```

## 6. Production Deployment

### A. Model Persistence
Models are automatically saved to:
- `models/`: LSTM model files (.h5)
- `scalers/`: Feature scaling parameters
- `metrics/`: Performance metrics

### B. Real-time Inference
```python
# Generate forecasts
forecast = forecasting_service.generate_forecast(
    warehouse_id="WH001",
    sku_id="SKU-001",
    horizon_days=7
)

# Detect anomalies
anomalies = anomaly_service.detect_anomalies(
    warehouse_id="WH001", 
    sku_id="SKU-001",
    recent_data=recent_sales
)
```

### C. Model Updates
- **Retrain Frequency**: Monthly or when performance degrades
- **Incremental Learning**: Add new data to existing models
- **A/B Testing**: Compare new vs. old model performance

## 7. Best Practices

### A. Data Management
- **Consistent Format**: Maintain data schema consistency
- **Regular Updates**: Daily data ingestion for real-time predictions
- **Data Validation**: Implement automated quality checks
- **Backup Strategy**: Regular model and data backups

### B. Model Management
- **Version Control**: Track model versions and performance
- **Monitoring**: Set up alerts for model degradation
- **Documentation**: Record training parameters and results
- **Testing**: Validate models on unseen data

### C. Performance Optimization
- **GPU Acceleration**: Use CUDA-enabled TensorFlow for faster training
- **Batch Processing**: Process multiple warehouse-SKU combinations
- **Caching**: Cache frequently used models in memory
- **Load Balancing**: Distribute model inference across servers

## 8. Troubleshooting

### Common Issues

#### A. Insufficient Data
**Problem**: "Insufficient data for training"
**Solution**: 
- Collect more historical data
- Use data augmentation techniques
- Generate synthetic data for initial training

#### B. Poor Model Performance
**Problem**: High MAPE or low R² scores
**Solution**:
- Check data quality and consistency
- Increase training data volume
- Adjust model hyperparameters
- Add more relevant features

#### C. Training Failures
**Problem**: Models fail to converge
**Solution**:
- Reduce learning rate
- Increase batch size
- Check for data normalization issues
- Verify feature engineering

## 9. Advanced Features

### A. External Data Integration
```python
# Fetch market data for feature engineering
market_data = data_service.get_external_market_data(
    symbols=["AAPL", "MSFT", "GOOGL"],
    period="1y"
)
```

### B. Multi-variate Forecasting
- **Price Data**: Integrate commodity prices
- **Weather Data**: Seasonal demand patterns
- **Economic Indicators**: GDP, inflation, etc.
- **Social Media**: Sentiment analysis

### C. Ensemble Methods
- Combine multiple LSTM models
- Blend with traditional statistical methods
- Use different architectures (GRU, Transformer)

## 10. Cost Optimization

### A. Training Costs
- **Cloud GPUs**: Use spot instances for training
- **Local Training**: Train on local hardware when possible
- **Batch Training**: Train multiple models simultaneously

### B. Inference Costs
- **Model Quantization**: Reduce model size
- **Caching**: Cache predictions for repeated queries
- **Batch Inference**: Process multiple requests together

## 11. Security Considerations

### A. Data Privacy
- **Encryption**: Encrypt data in transit and at rest
- **Access Control**: Implement role-based access
- **Audit Logging**: Track all data access and model usage

### B. Model Security
- **Model Validation**: Validate input data to prevent attacks
- **Rate Limiting**: Prevent abuse of prediction endpoints
- **Secure Storage**: Protect model files and parameters

## 12. Monitoring and Maintenance

### A. Performance Monitoring
- **Real-time Metrics**: Track prediction accuracy
- **Drift Detection**: Monitor data distribution changes
- **Alert System**: Notify when models need retraining

### B. Regular Maintenance
- **Weekly**: Check model performance metrics
- **Monthly**: Retrain models with new data
- **Quarterly**: Review and update model architecture
- **Annually**: Comprehensive model audit

## 13. Getting Started Checklist

- [ ] Install required dependencies (TensorFlow, Keras, etc.)
- [ ] Prepare historical sales data (minimum 100 days)
- [ ] Validate data quality and format
- [ ] Train initial forecasting model
- [ ] Train initial anomaly detector
- [ ] Evaluate model performance
- [ ] Deploy models to production
- [ ] Set up monitoring and alerts
- [ ] Plan regular retraining schedule

## 14. Support and Resources

### Documentation
- [TensorFlow LSTM Guide](https://www.tensorflow.org/tutorials/structured_data/time_series)
- [Keras LSTM Documentation](https://keras.io/api/layers/recurrent_layers/lstm/)
- [Time Series Forecasting Best Practices](https://otexts.com/fpp3/)

### Community
- [TensorFlow Community](https://community.tensorflow.org/)
- [Kaggle Competitions](https://www.kaggle.com/competitions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/lstm)

### Tools
- **Jupyter Notebooks**: For experimentation and analysis
- **MLflow**: For experiment tracking and model management
- **TensorBoard**: For training visualization
- **Weights & Biases**: For experiment tracking and collaboration

---

**Note**: This guide assumes you have basic knowledge of machine learning and Python. For advanced topics, refer to the provided resources and consider consulting with data science professionals.
