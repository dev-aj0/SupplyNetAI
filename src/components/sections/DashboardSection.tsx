import React from 'react';
import { Package, Truck, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import ForecastChart from '../ForecastChart';
import { ForecastData, StockRecommendation, RouteData, Anomaly } from '../../types';

interface DashboardSectionProps {
  forecastData: ForecastData[];
  stockRecommendations: StockRecommendation[];
  routeData: RouteData[];
  anomalies: Anomaly[];
  isUpdating: boolean;
  onUpdateData: () => void;
  lastUpdated: Date;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  forecastData,
  stockRecommendations,
  routeData,
  anomalies,
  isUpdating,
  onUpdateData,
  lastUpdated
}) => {
  // Safety checks for arrays
  const stockArray = Array.isArray(stockRecommendations) ? stockRecommendations : [];
  const routesArray = Array.isArray(routeData) ? routeData : [];
  const anomaliesArray = Array.isArray(anomalies) ? anomalies : [];
  
  const urgentStockItems = stockArray.filter(item => item.status === 'urgent').length;
  const totalRoutes = routesArray.length;
  const highSeverityAnomalies = anomaliesArray.filter(a => a.severity === 'high').length;
  const avgEfficiency = routesArray.reduce((acc, route) => acc + (route.efficiency_score || 0), 0) / routesArray.length || 0;

  return (
    <div className="space-y-8">
      {/* Clean Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Supplynet Dashboard</h1>
          <p className="text-secondary mt-1">Real-time logistics intelligence</p>
        </div>
        <button
          onClick={onUpdateData}
          disabled={isUpdating}
          className="btn-primary inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Updating...' : 'Refresh Data'}
        </button>
      </div>

      {/* Key Metrics - Simple 4-card layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary">Urgent Stock</p>
              <p className="text-3xl font-bold text-red-600">{urgentStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary">Active Routes</p>
              <p className="text-3xl font-bold text-green-600">{totalRoutes}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary">Alerts</p>
              <p className="text-3xl font-bold text-yellow-600">{highSeverityAnomalies}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary">Efficiency</p>
              <p className="text-3xl font-bold text-blue-600">{Math.round(avgEfficiency)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-card rounded-xl shadow-sm p-6 border">
        <h2 className="text-xl font-semibold text-primary mb-4">Demand Forecast</h2>
        <ForecastChart data={forecastData} />
      </div>

      {/* Data Files Information */}
      <div className="bg-card rounded-xl shadow-sm p-6 border">
        <h2 className="text-xl font-semibold text-primary mb-4">Data Sources & Files</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-blue-900">Active Data Files</p>
                <p className="text-sm text-blue-700">The system is currently using these data sources:</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="bg-white rounded p-3 border border-blue-200">
                <span className="font-medium text-blue-900">Sales Data:</span>
                <span className="ml-2 text-blue-700">sales_data_2024.csv</span>
              </div>
              <div className="bg-white rounded p-3 border border-blue-200">
                <span className="font-medium text-blue-900">Inventory:</span>
                <span className="ml-2 text-blue-700">warehouse_stock_levels.csv</span>
              </div>
              <div className="bg-white rounded p-3 border border-blue-200">
                <span className="font-medium text-blue-900">Customer Locations:</span>
                <span className="ml-2 text-blue-700">customer_locations.csv</span>
              </div>
              <div className="bg-white rounded p-3 border border-blue-200">
                <span className="font-medium text-blue-900">ML Models:</span>
                <span className="ml-2 text-blue-700">lstm_models/*.pth</span>
              </div>
              <div className="bg-white rounded p-3 border border-blue-200">
                <span className="font-medium text-blue-900">Forecasts:</span>
                <span className="ml-2 text-blue-700">lstm_forecasts_2024.json</span>
              </div>
              <div className="bg-white rounded p-3 border border-blue-200">
                <span className="font-medium text-blue-900">Anomaly Data:</span>
                <span className="ml-2 text-blue-700">anomaly_metrics/*.json</span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-green-900">Data Processing</p>
                <p className="text-sm text-green-700">
                  All data is processed in real-time using ML models for forecasting, 
                  anomaly detection, and optimization. Data is validated and cleaned 
                  before analysis to ensure accuracy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status Overview - Simple two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-semibold text-primary mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {anomaliesArray.slice(0, 3).map((anomaly) => (
              <div key={anomaly.id} className="flex items-center space-x-3 p-3 bg-secondary rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  anomaly.severity === 'high' ? 'bg-red-500' :
                  anomaly.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">{anomaly.warehouse_id}</p>
                  <p className="text-xs text-secondary">{anomaly.description}</p>
                </div>
              </div>
            ))}
            {anomalies.length === 0 && (
              <p className="text-sm text-secondary text-center py-4">No alerts - all systems normal</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-semibold text-primary mb-4">Stock Status</h3>
          <div className="space-y-3">
            {stockRecommendations.filter(s => s.status === 'urgent').slice(0, 3).map((stock, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">{stock.sku_id}</p>
                  <p className="text-xs text-secondary">Stock: {stock.current_stock} | Need: {stock.recommended_order_qty}</p>
                </div>
              </div>
            ))}
            {stockRecommendations.filter(s => s.status === 'urgent').length === 0 && (
              <p className="text-sm text-secondary text-center py-4">All stock levels optimal</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;