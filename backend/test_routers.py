#!/usr/bin/env python3
"""Test script to check if routers can be imported"""

try:
    print("Testing router imports...")
    
    print("1. Importing dashboard router...")
    from app.routers.dashboard import router as dashboard_router
    print("   ✅ Dashboard router imported successfully")
    
    print("2. Importing forecasting router...")
    from app.routers.forecasting import router as forecasting_router
    print("   ✅ Forecasting router imported successfully")
    
    print("3. Checking router endpoints...")
    
    # Check dashboard router endpoints
    dashboard_endpoints = [route.path for route in dashboard_router.routes]
    print(f"   Dashboard endpoints: {dashboard_endpoints}")
    
    # Check forecasting router endpoints
    forecasting_endpoints = [route.path for route in forecasting_router.routes]
    print(f"   Forecasting endpoints: {forecasting_endpoints}")
    
    print("\n✅ All routers imported successfully!")
    
except Exception as e:
    print(f"\n❌ Error importing routers: {e}")
    import traceback
    traceback.print_exc()
