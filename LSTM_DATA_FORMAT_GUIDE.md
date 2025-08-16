# 📊 LSTM Data Format Guide for SupplyNet AI

## 🎯 **Purpose**
This guide explains the exact CSV format required for training LSTM forecasting models in SupplyNet's AI system.

## 📋 **Required CSV Structure**

### **Column Headers (Exact Order)**
```csv
date,warehouse_id,sku_id,units_sold,revenue,order_id,client_id
```

### **Data Types & Format**
| Column | Type | Format | Example | Required |
|--------|------|--------|---------|----------|
| `date` | String | YYYY-MM-DD | "2024-08-16" | ✅ Required |
| `warehouse_id` | String | Text | "WH001" | ✅ Required |
| `sku_id` | String | Text | "SKU001" | ✅ Required |
| `units_sold` | Integer | Whole number | 47 | ✅ Required |
| `revenue` | Decimal | Number with decimals | 1221.53 | ✅ Required |
| `order_id` | String | Text | "ORD-20240816-000" | ✅ Required |
| `client_id` | String | Text | "CUST-000" | ✅ Required |

## 🔧 **LSTM Feature Engineering**

The AI system automatically creates these features from your CSV:

### **Temporal Features**
- **`day_of_week`**: 0-6 (Monday=0, Sunday=6)
- **`month`**: 1-12
- **`quarter`**: 1-4
- **`is_weekend`**: 0 or 1
- **`is_holiday`**: 0 or 1 (New Year, July 4th, Christmas)

### **Statistical Features**
- **`rolling_mean`**: 7-day moving average
- **`rolling_std`**: 7-day standard deviation
- **`trend`**: Linear trend over time

## 📊 **Data Requirements**

### **Minimum Requirements**
- **Time Period**: At least 30 days of data
- **Frequency**: Daily data (missing dates filled with 0)
- **Quality**: No missing values in required fields
- **Format**: CSV with UTF-8 encoding

### **Optimal Requirements**
- **Time Period**: 365+ days for seasonal patterns
- **Frequency**: Daily data with consistent timestamps
- **Coverage**: Multiple warehouses and SKUs
- **Variability**: Realistic demand patterns

## 📁 **Sample Data**

### **Sample CSV (First 5 rows)**
```csv
date,warehouse_id,sku_id,units_sold,revenue,order_id,client_id
2024-08-16,WH001,SKU001,47,1221.53,ORD-20240816-000,CUST-000
2024-08-17,WH001,SKU001,18,467.82,ORD-20240817-001,CUST-001
2024-08-18,WH001,SKU001,44,1143.56,ORD-20240818-002,CUST-002
2024-08-19,WH001,SKU001,38,987.62,ORD-20240819-003,CUST-003
2024-08-20,WH001,SKU001,34,883.66,ORD-20240820-004,CUST-004
```

### **Data Patterns**
- **Base Demand**: 20-150 units per day
- **Seasonality**: Q4 peak (holiday season)
- **Weekly Patterns**: Lower on weekends
- **Variability**: 15-30% daily variation

## 🚀 **How to Use**

### **1. Prepare Your Data**
- Export sales data in the exact format above
- Ensure all required columns are present
- Validate data quality (no missing values)

### **2. Upload to SupplyNet**
- Use the "Upload Data" button in the dashboard
- Select your CSV file
- The system will validate and process your data

### **3. Train LSTM Models**
- Navigate to the Forecasting section
- Select warehouse and SKU combinations
- Click "Train Model" to create AI forecasts

### **4. View Results**
- Real-time demand predictions
- Confidence intervals
- Seasonal pattern analysis
- Anomaly detection

## ⚠️ **Common Issues & Solutions**

### **Issue: "Invalid date format"**
**Solution**: Ensure dates are YYYY-MM-DD format

### **Issue: "Missing required columns"**
**Solution**: Check column names match exactly (case-sensitive)

### **Issue: "No data for forecasting"**
**Solution**: Ensure at least 30 days of data are present

### **Issue: "Poor forecast accuracy"**
**Solution**: Provide more historical data (365+ days recommended)

## 🔍 **Data Quality Checklist**

- [ ] All required columns present
- [ ] Date format: YYYY-MM-DD
- [ ] No missing values
- [ ] Consistent warehouse/SKU IDs
- [ ] Realistic sales quantities
- [ ] Daily frequency maintained
- [ ] UTF-8 encoding
- [ ] No extra spaces or characters

## 📈 **Expected Results**

With properly formatted data, you can expect:
- **Forecast Accuracy**: 85-95% for 7-day predictions
- **Seasonal Detection**: Automatic holiday and trend identification
- **Anomaly Detection**: Statistical outlier identification
- **Confidence Intervals**: Uncertainty quantification
- **Real-time Updates**: Continuous model improvement

## 🆘 **Need Help?**

If you encounter issues:
1. Check the data format against this guide
2. Verify all required columns are present
3. Ensure data quality meets minimum requirements
4. Contact support with specific error messages

---

**Note**: This format is optimized for LSTM neural networks and provides the best forecasting accuracy when followed precisely. 