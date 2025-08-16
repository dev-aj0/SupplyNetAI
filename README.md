# SupplyNet - Predictive Logistics Optimizer

SupplyNet is a comprehensive predictive logistics optimization platform designed for Small and Medium Businesses (SMBs). It provides end-to-end logistics optimization including demand forecasting, inventory management, route optimization, and anomaly detection.

## 🚀 Features

### Core Capabilities
- **Demand Forecasting**: Prophet-based time series forecasting with cross-validation
- **Inventory Optimization**: Safety stock calculations, reorder points, and stock recommendations
- **Route Optimization**: OR-Tools powered vehicle routing with distance matrices
- **Anomaly Detection**: Multi-method anomaly detection (Z-score, MAD, Prophet residuals)
- **Data Ingestion**: CSV/Excel upload support with validation and cleaning
- **Real-time Dashboard**: Comprehensive analytics and actionable insights

### Technical Features
- **FastAPI Backend**: High-performance async API with automatic documentation
- **React Frontend**: Modern, responsive UI with real-time updates
- **ML Pipeline**: Production-ready machine learning models with model management
- **Scalable Architecture**: Modular design for easy extension and scaling
- **Docker Support**: Containerized deployment for consistent environments

## 🏗️ Architecture

```
SupplyNet/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── core/           # Configuration, database, middleware
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── schemas/        # Pydantic data validation
│   │   ├── services/       # Business logic and ML services
│   │   └── routers/        # API endpoints
│   ├── models/             # Trained ML models
│   └── requirements.txt    # Python dependencies
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── services/           # API integration
│   └── utils/              # Helper functions
└── docker-compose.yml      # Multi-service deployment
```

## 🛠️ Installation & Setup

### Prerequisites
- Docker and Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for local frontend development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd supplynet
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
npm install
npm run dev
```

## 📊 API Documentation

### Core Endpoints

#### Data Ingestion
- `POST /api/v1/upload/file` - Upload CSV/Excel files
- `POST /api/v1/upload/batch` - Upload data via API
- `GET /api/v1/sample-data` - Generate sample data

#### Forecasting
- `POST /api/v1/forecasting/train` - Train forecasting models
- `POST /api/v1/forecasting/forecast` - Generate demand forecasts
- `GET /api/v1/forecasting/models/list` - List available models

#### Inventory Optimization
- `POST /api/v1/optimization/stock/recommendations` - Get stock recommendations
- `POST /api/v1/optimization/stock/what-if` - Perform what-if analysis
- `GET /api/v1/optimization/stock/analytics/global` - Global inventory analytics

#### Route Optimization
- `POST /api/v1/routing/optimize` - Optimize delivery routes
- `POST /api/v1/routing/what-if` - Route what-if analysis
- `GET /api/v1/routing/analytics/global` - Global routing analytics

#### Anomaly Detection
- `POST /api/v1/anomalies/detect` - Detect anomalies in data
- `GET /api/v1/anomalies/list` - List detected anomalies
- `GET /api/v1/anomalies/analytics/summary` - Anomaly summary

#### Dashboard
- `GET /api/v1/dashboard/overview` - Comprehensive dashboard overview
- `GET /api/v1/dashboard/kpis` - Key performance indicators
- `GET /api/v1/dashboard/recommendations` - Actionable recommendations

### Data Formats

#### Sales Data Upload
```csv
date,warehouse_id,sku_id,units_sold,order_id,client_id,location_lat,location_lng
2024-01-01,WH001,SKU-ELEC-001,25,ORD-001,CUST001,47.6062,-122.3321
2024-01-01,WH001,SKU-HOME-002,15,ORD-002,CUST002,45.5152,-122.6784
```

#### API Response Format
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
npm run test
```

### Integration Tests
```bash
# Test API endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/dashboard/overview
```

## 📈 Demo Scenarios

### 1. Data Upload & Processing
1. Navigate to Upload section
2. Upload sample CSV file
3. View data validation results
4. See summary statistics

### 2. Demand Forecasting
1. Go to Forecasting section
2. Select warehouse and SKU
3. View historical data and forecasts
4. Analyze model performance metrics

### 3. Inventory Optimization
1. Navigate to Inventory section
2. View stock recommendations
3. Analyze safety stock calculations
4. Perform what-if scenarios

### 4. Route Optimization
1. Go to Routes section
2. View optimized delivery routes
3. Analyze route efficiency
4. Explore cost savings

### 5. Anomaly Detection
1. Check Anomalies section
2. Review detected anomalies
3. Analyze severity distribution
4. Take recommended actions

## 🔧 Configuration

### Environment Variables
```bash
# Backend
DATABASE_URL=sqlite:///./supplynet.db
LOG_LEVEL=INFO
SECRET_KEY=your-secret-key

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Model Parameters
- **Forecasting**: Adjust Prophet parameters in `ForecastingService`
- **Anomaly Detection**: Modify thresholds in `AnomalyDetectionService`
- **Stock Optimization**: Configure safety stock multipliers in `StockOptimizationService`
- **Route Optimization**: Set vehicle constraints in `RouteOptimizationService`

## 🚀 Deployment

### Production Deployment
1. **Environment Setup**
   ```bash
   export DATABASE_URL=postgresql://user:pass@host/db
   export REDIS_URL=redis://host:6379
   export SECRET_KEY=production-secret-key
   ```

2. **Docker Production**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Kubernetes Deployment**
   ```bash
   kubectl apply -f k8s/
   ```

### Scaling Considerations
- **Horizontal Scaling**: Deploy multiple backend instances behind load balancer
- **Database**: Use PostgreSQL for production, implement connection pooling
- **Caching**: Redis for model caching and session management
- **Monitoring**: Implement health checks and metrics collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use TypeScript for frontend development
- Write tests for new features
- Update documentation for API changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
1. **Port conflicts**: Ensure ports 8000 and 5173 are available
2. **Docker issues**: Check Docker daemon is running
3. **Model training**: Ensure sufficient data for Prophet models

### Getting Help
- Check the [Issues](issues) page for known problems
- Review API documentation at `/docs` endpoint
- Contact the development team

## 🔮 Roadmap

### Upcoming Features
- [ ] Real-time data streaming
- [ ] Advanced ML models (LSTM, Transformer)
- [ ] Multi-warehouse optimization
- [ ] Mobile application
- [ ] Integration with ERP systems

### Performance Improvements
- [ ] Model caching and optimization
- [ ] Async processing for large datasets
- [ ] Database query optimization
- [ ] Frontend performance enhancements

---

**SupplyNet** - Transforming logistics through intelligent optimization and predictive analytics.
