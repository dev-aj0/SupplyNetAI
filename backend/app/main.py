from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
from contextlib import asynccontextmanager

# Import routers directly
from app.routers import data_ingestion
from app.routers import forecasting
from app.routers import optimization
from app.routers import routing
from app.routers import anomalies
from app.routers import dashboard
from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # await init_db()  # Commented out for now - database not required for LSTM models
    yield
    # Shutdown
    pass


app = FastAPI(
    title="SupplyNet AI API",
    version="1.0.0"
)

# Add CORS middleware BEFORE other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers with debug logging
print("🔧 Including routers...")

print("  📊 Including dashboard router...")
app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
print(f"    ✅ Dashboard router included with {len(dashboard.router.routes)} routes")

print("  🚀 Including forecasting router...")
app.include_router(forecasting.router, prefix="/api/v1/forecasting", tags=["Forecasting"])
print(f"    ✅ Forecasting router included with {len(forecasting.router.routes)} routes")

print("  📦 Including data ingestion router...")
app.include_router(data_ingestion.router, prefix="/api/v1", tags=["Data Ingestion"])
print(f"    ✅ Data ingestion router included with {len(data_ingestion.router.routes)} routes")

print("  ⚙️ Including optimization router...")
app.include_router(optimization.router, prefix="/api/v1/optimization", tags=["Optimization"])
print(f"    ✅ Optimization router included with {len(optimization.router.routes)} routes")

print("  🛣️ Including routing router...")
app.include_router(routing.router, prefix="/api/v1/routing", tags=["Routing"])
print(f"    ✅ Routing router included with {len(routing.router.routes)} routes")

print("  🚨 Including anomalies router...")
app.include_router(anomalies.router, prefix="/api/v1/anomalies", tags=["Anomalies"])
print(f"    ✅ Anomalies router included with {len(anomalies.router.routes)} routes")

print("🎉 All routers included successfully!")


@app.get("/")
async def root():
    return {"message": "SupplyNet API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/ai-status")
async def get_ai_status():
    """Get comprehensive status of all AI/ML services"""
    try:
        from app.services.ai_integration_service import AIIntegrationService
        ai_service = AIIntegrationService()
        return {
            "status": "success",
            "ai_services": ai_service.get_ai_service_status(),
            "message": "AI Integration Service Status"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Failed to get AI service status"
        }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
from app.routers import dashboard, forecasting, optimization, routing, anomalies, data_ingestion

app.include_router(data_ingestion.router)
