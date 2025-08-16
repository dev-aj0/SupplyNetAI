#!/usr/bin/env python3
"""
Test script to verify all AI endpoints are working correctly
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint, method="GET", data=None, params=None):
    """Test an endpoint and return the result"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=params)
        elif method == "POST":
            response = requests.post(url, params=params, json=data)
        else:
            return {"error": f"Unsupported method: {method}"}
        
        if response.status_code == 200:
            return {"status": "success", "data": response.json()}
        else:
            return {"status": "error", "code": response.status_code, "error": response.text}
            
    except Exception as e:
        return {"status": "error", "error": str(e)}

def main():
    print("🧪 Testing AI Endpoints...")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1. Testing Health Check...")
    result = test_endpoint("/health")
    if result["status"] == "success":
        print("✅ Health check passed")
    else:
        print(f"❌ Health check failed: {result}")
    
    # Test 2: AI Status
    print("\n2. Testing AI Status...")
    result = test_endpoint("/ai-status")
    if result["status"] == "success":
        print("✅ AI status endpoint working")
        ai_services = result["data"]["ai_services"]
        print(f"   - Forecasting: {ai_services['forecasting_service']['status']}")
        print(f"   - Anomaly Detection: {ai_services['anomaly_service']['status']}")
        print(f"   - Stock Optimization: {ai_services['stock_optimization']['status']}")
        print(f"   - Route Optimization: {ai_services['route_optimization']['status']}")
    else:
        print(f"❌ AI status failed: {result}")
    
    # Test 3: Forecasting
    print("\n3. Testing AI Forecasting...")
    result = test_endpoint("/api/v1/forecasting/forecast", method="POST", 
                          params={"warehouse_id": "WH001", "sku_id": "SKU001", "horizon_days": "7"})
    if result["status"] == "success":
        forecast_data = result["data"]
        print(f"✅ Forecasting working - {len(forecast_data.get('forecast_data', []))} days forecasted")
        print(f"   - Method: {forecast_data.get('prediction_method')}")
        print(f"   - Data points: {forecast_data.get('data_points')}")
    else:
        print(f"❌ Forecasting failed: {result}")
    
    # Test 4: Anomaly Detection
    print("\n4. Testing AI Anomaly Detection...")
    result = test_endpoint("/api/v1/anomalies/detect", method="POST",
                          params={"warehouse_id": "WH001", "sku_id": "SKU001"})
    if result["status"] == "success":
        anomaly_data = result["data"]
        print(f"✅ Anomaly detection working - {len(anomaly_data.get('anomalies', []))} anomalies found")
        print(f"   - Method: {anomaly_data.get('detection_method')}")
    else:
        print(f"❌ Anomaly detection failed: {result}")
    
    # Test 5: Stock Optimization
    print("\n5. Testing AI Stock Optimization...")
    result = test_endpoint("/api/v1/optimization/stock/recommendations", method="POST",
                          params={"warehouse_id": "WH001", "sku_id": "SKU001"})
    if result["status"] == "success":
        stock_data = result["data"]
        print(f"✅ Stock optimization working - Status: {stock_data.get('status')}")
        print(f"   - Current stock: {stock_data.get('current_stock')}")
        print(f"   - Recommended: {stock_data.get('recommended_order_qty')}")
    else:
        print(f"❌ Stock optimization failed: {result}")
    
    # Test 6: Route Optimization
    print("\n6. Testing AI Route Optimization...")
    delivery_points = [
        {"lat": 40.7589, "lng": -73.9851, "demand_qty": 50},
        {"lat": 40.7128, "lng": -74.0060, "demand_qty": 75}
    ]
    result = test_endpoint("/api/v1/routing/optimize", method="POST",
                          params={"warehouse_id": "WH001"}, data=delivery_points)
    if result["status"] == "success":
        route_data = result["data"]
        print(f"✅ Route optimization working - {route_data.get('total_routes')} routes created")
        print(f"   - Total distance: {route_data.get('total_distance')} mi")
        print(f"   - Efficiency: {route_data.get('efficiency_score')}%")
    else:
        print(f"❌ Route optimization failed: {result}")
    
    # Test 7: Dashboard Overview
    print("\n7. Testing Dashboard Overview...")
    result = test_endpoint("/api/v1/overview")
    if result["status"] == "success":
        dashboard_data = result["data"]
        print("✅ Dashboard overview working")
        print(f"   - Total warehouses: {dashboard_data.get('summary', {}).get('total_warehouses')}")
        print(f"   - Total SKUs: {dashboard_data.get('summary', {}).get('total_skus')}")
    else:
        print(f"❌ Dashboard overview failed: {result}")
    
    # Test 8: Global Analytics
    print("\n8. Testing Global Analytics...")
    result = test_endpoint("/api/v1/optimization/stock/analytics/global")
    if result["status"] == "success":
        analytics_data = result["data"]
        print("✅ Global stock analytics working")
        print(f"   - Total SKUs: {analytics_data.get('total_skus')}")
        print(f"   - Stock status: {analytics_data.get('stock_status_summary')}")
    else:
        print(f"❌ Global stock analytics failed: {result}")
    
    print("\n" + "=" * 50)
    print("🎉 AI Endpoint Testing Complete!")
    print(f"Timestamp: {datetime.now().isoformat()}")

if __name__ == "__main__":
    main() 