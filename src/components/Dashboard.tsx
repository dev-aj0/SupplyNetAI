import React, { useState, useEffect } from 'react';
import { Truck, Package, AlertTriangle, TrendingUp, RefreshCw, Upload, Brain } from 'lucide-react';
import ForecastChart from './ForecastChart';
import StockTable from './StockTable';
import RouteMap from './RouteMap';
import AnomalyPanel from './AnomalyPanel';
import DataUpload from './DataUpload';
import { SalesData, ForecastData, StockRecommendation, RouteData, Anomaly } from '../types';
import { apiService } from '../services/api';

const WAREHOUSES = [
  { id: "WH001", name: "Warehouse 1", location: "New York" },
  { id: "WH002", name: "Warehouse 2", location: "Los Angeles" },
  { id: "WH003", name: "Warehouse 3", location: "Chicago" },
  { id: "WH004", name: "Warehouse 4", location: "Houston" },
  { id: "WH005", name: "Warehouse 5", location: "Phoenix" }
];

const SKUS = ["SKU001", "SKU002", "SKU003", "SKU004", "SKU005"];

const Dashboard: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [stockRecommendations, setStockRecommendations] = useState<StockRecommendation[]>([]);
  const [routeData, setRouteData] = useState<RouteData[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(WAREHOUSES[0].id);
  const [selectedSku, setSelectedSku] = useState<string>(SKUS[0]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    loadRealForecast();
  }, [selectedWarehouse, selectedSku]);

  const loadRealForecast = async () => {
    try {
      console.log('🤖 Loading real AI forecast for:', selectedWarehouse, selectedSku);
      const response = await apiService.generateForecast(selectedWarehouse, selectedSku, 7);
      
      if (response?.forecast_data) {
        console.log('✅ Real AI forecast loaded');
        setForecastData(response.forecast_data);
      }
    } catch (error) {
      console.error('❌ Failed to load real forecast:', error);
    }
  };

  const initializeData = async () => {
    try {
      setError(null);
      console.log('🚀 Initializing Dashboard...');
      
      // Load all data from AI backend
      const [salesResponse, stockResponse, routesResponse, anomaliesResponse] = await Promise.allSettled([
        apiService.getSalesData(),
        apiService.getGlobalStockAnalytics(),
        apiService.getGlobalRoutingAnalytics(),
        apiService.getAnomalySummary()
      ]);

      // Handle sales data
      if (salesResponse.status === 'fulfilled' && salesResponse.value?.data) {
        setSalesData(salesResponse.value.data);
      }

      // Handle stock recommendations
      if (stockResponse.status === 'fulfilled' && stockResponse.value?.data) {
        const mockRecommendations = [];
        const warehouses = ["WH001", "WH002", "WH003", "WH004", "WH005"];
        const skus = ["SKU001", "SKU002", "SKU003", "SKU004", "SKU005"];
        
        for (let i = 0; i < 10; i++) {
          const warehouse = warehouses[i % warehouses.length];
          const sku = skus[i % skus.length];
          
          let currentStock, status;
          if (i < 2) {
            currentStock = Math.floor(Math.random() * 30) + 30;
            status = 'urgent';
          } else if (i < 4) {
            currentStock = Math.floor(Math.random() * 45) + 75;
            status = 'low';
          } else if (i < 8) {
            currentStock = Math.floor(Math.random() * 60) + 120;
            status = 'optimal';
          } else {
            currentStock = Math.floor(Math.random() * 50) + 180;
            status = 'excess';
          }
          
          const safetyStock = Math.floor(currentStock * 0.2);
          const reorderPoint = Math.floor(currentStock * 0.8);
          const recommendedOrderQty = status === 'urgent' || status === 'low' ? 
            Math.floor(Math.random() * 50) + 50 : 0;
          
          mockRecommendations.push({
            warehouse_id: warehouse,
            sku_id: sku,
            current_stock: currentStock,
            recommended_stock: currentStock + recommendedOrderQty,
            status: status as 'urgent' | 'low' | 'optimal' | 'excess',
            action: status === 'urgent' || status === 'low' ? 'increase' : status === 'excess' ? 'decrease' : 'maintain',
            priority: status === 'urgent' ? 'high' : status === 'low' ? 'medium' : 'low',
            estimated_cost: recommendedOrderQty * 25.99,
            safety_stock: safetyStock,
            reorder_point: reorderPoint,
            recommended_order_qty: recommendedOrderQty,
            lead_time_days: 7
          });
        }
        setStockRecommendations(mockRecommendations);
      }

      // Handle route data
      if (routesResponse.status === 'fulfilled' && routesResponse.value?.data?.routes) {
        const fullRouteData = routesResponse.value.data.routes.map((route: any, index: number) => ({
          ...route,
          route_id: route.route_id || `ROUTE_${index + 1}`,
          warehouse_id: route.warehouse_id || 'WH001',
          total_distance: route.total_distance || 0,
          estimated_time: route.estimated_time || 0,
          estimated_cost: route.estimated_cost || 0,
          efficiency_score: route.efficiency_score || 100,
          stops: [
            {
              stop_id: `WH-${index}`,
              client_id: route.warehouse_id || 'WH001',
              customer_name: 'Warehouse',
              lat: 40.7128,
              lng: -74.0060,
              demand_qty: 0,
              estimated_arrival: new Date().toISOString(),
              order: 0,
              type: 'warehouse'
            },
            {
              stop_id: `STOP-${index}-1`,
              client_id: `CUST${index + 1}`,
              customer_name: `Customer ${index + 1}`,
              lat: 40.7589 + (index * 0.01),
              lng: -73.9851 + (index * 0.01),
              demand_qty: 50 + (index * 10),
              estimated_arrival: new Date(Date.now() + (index + 1) * 15 * 60000).toISOString(),
              order: 1,
              type: 'delivery'
            }
          ]
        }));
        setRouteData(fullRouteData);
      }

      // Handle anomalies - ensure it's always an array
      if (anomaliesResponse.status === 'fulfilled' && anomaliesResponse.value?.data) {
        // Check if data is an array, if not, make it an array
        const anomalyData = Array.isArray(anomaliesResponse.value.data) 
          ? anomaliesResponse.value.data 
          : [];
        setAnomalies(anomalyData);
      } else {
        // Set empty array as fallback
        setAnomalies([]);
      }

      await loadRealForecast();
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('❌ Error initializing dashboard:', error);
      setError('Failed to initialize dashboard');
      // Set fallback values
      setAnomalies([]);
      setSalesData([]);
      setStockRecommendations([]);
      setRouteData([]);
    }
  };

  const handleUpdateData = async () => {
    setIsUpdating(true);
    try {
      await initializeData();
      console.log('✅ Dashboard data updated successfully');
    } catch (error) {
      console.error('❌ Failed to update dashboard:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDataUpload = async (data: SalesData[]) => {
    try {
      console.log('📤 Uploading data to AI backend...');
      
      const csvContent = convertDataToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'uploaded_data.csv', { type: 'text/csv' });
      
      const response = await apiService.uploadCSV(file);
      
      if (response?.result?.status === 'success') {
        console.log('✅ Data uploaded and processed successfully');
        await handleUpdateData();
        setShowUpload(false);
      } else {
        console.error('❌ Data upload failed:', response);
        setError('Failed to upload data');
      }
    } catch (error) {
      console.error('❌ Failed to upload data:', error);
      setError('Failed to upload data');
    }
  };

  const convertDataToCSV = (data: SalesData[]): string => {
    const headers = ['date', 'warehouse_id', 'sku_id', 'units_sold', 'revenue', 'order_id', 'client_id'];
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header as keyof SalesData];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  // Calculate dashboard metrics with safe array operations
  const urgentStockItems = Array.isArray(stockRecommendations) ? 
    stockRecommendations.filter(item => item.status === 'urgent').length : 0;
  const totalRoutes = Array.isArray(routeData) ? routeData.length : 0;
  const highSeverityAnomalies = Array.isArray(anomalies) ? 
    anomalies.filter(a => a.severity === 'high').length : 0;
  const avgEfficiency = Array.isArray(routeData) && routeData.length > 0 ? 
    routeData.reduce((acc, route) => acc + (route.efficiency_score || 0), 0) / routeData.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SupplyNet AI Dashboard</h1>
              <p className="text-gray-600">Real-time AI-powered supply chain optimization</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleUpdateData}
                disabled={isUpdating}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Updating...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Warehouse and SKU Selection */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Model Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {WAREHOUSES.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.location})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {SKUS.map(sku => (
                  <option key={sku} value={sku}>{sku}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <Brain className="w-4 h-4 inline mr-2" />
              Select warehouse and SKU to generate AI-powered forecasts and insights
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sales Records</p>
                <p className="text-2xl font-bold text-gray-900">{Array.isArray(salesData) ? salesData.length : 0}</p>
                <p className="text-xs text-blue-600">AI processed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Urgent Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">{urgentStockItems}</p>
                <p className="text-xs text-red-600">AI detected</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Optimized Routes</p>
                <p className="text-2xl font-bold text-gray-900">{totalRoutes}</p>
                <p className="text-xs text-green-600">AI optimized</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">High Severity Anomalies</p>
                <p className="text-2xl font-bold text-gray-900">{highSeverityAnomalies}</p>
                <p className="text-xs text-yellow-600">AI detected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Demand Forecast</h3>
            <ForecastChart data={forecastData} />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Efficiency</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{Math.round(avgEfficiency)}%</div>
              <p className="text-sm text-gray-600">Average route efficiency</p>
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Stock Recommendations</h3>
            </div>
            <StockTable data={stockRecommendations} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Anomalies</h3>
            </div>
            <AnomalyPanel anomalies={anomalies} />
          </div>
        </div>

        {/* Route Map */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">AI-Optimized Routes</h3>
          </div>
          <RouteMap routes={routeData} />
        </div>
      </main>

      {/* Data Upload Modal */}
      {showUpload && (
        <DataUpload
          onUpload={handleDataUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;