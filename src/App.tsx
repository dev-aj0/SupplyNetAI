import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ForecastingSection from './components/sections/ForecastingSection';
import InventorySection from './components/sections/InventorySection';
import RoutesSection from './components/sections/RoutesSection';
import AnomaliesSection from './components/sections/AnomaliesSection';
import { apiService } from './services/api';
import { SalesData, ForecastData, StockRecommendation, RouteData, Anomaly } from './types';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Data state
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [stockRecommendations, setStockRecommendations] = useState<StockRecommendation[]>([]);
  const [routeData, setRouteData] = useState<RouteData[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  
  // Forecasting state
  const [selectedWarehouse, setSelectedWarehouse] = useState('WH001');
  const [selectedSku, setSelectedSku] = useState('SKU001');
  const [forecastHorizon, setForecastHorizon] = useState(7);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);

  // Function to refresh route data
  const refreshRouteData = async () => {
    try {
      const response = await apiService.getGlobalRoutingAnalytics();
      if (response?.data?.routes) {
        setRouteData(response.data.routes);
      }
    } catch (error) {
      console.log('Failed to refresh routes, using existing data');
    }
  };

  // Load data on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('🚀 Loading data from AI backend...');
        
        // Load all data from AI backend
        const [salesResponse, stockResponse, routesResponse, anomaliesResponse, forecastResponse] = await Promise.allSettled([
          apiService.getSalesData(),
          apiService.getGlobalStockAnalytics(),
          apiService.getGlobalRoutingAnalytics(),
          apiService.getAnomalySummary(),
          apiService.generateForecast(selectedWarehouse, selectedSku, forecastHorizon)
        ]);

        // Handle sales data
        if (salesResponse.status === 'fulfilled' && salesResponse.value?.data?.sales) {
          setSalesData(salesResponse.value.data.sales);
        }

        // Handle stock recommendations
        if (stockResponse.status === 'fulfilled' && stockResponse.value?.data?.recommendations) {
          setStockRecommendations(stockResponse.value.data.recommendations);
        }

        // Handle route data
        if (routesResponse.status === 'fulfilled' && routesResponse.value?.data?.routes) {
          setRouteData(routesResponse.value.data.routes);
        }

        // Handle anomalies
        if (anomaliesResponse.status === 'fulfilled' && anomaliesResponse.value?.data?.anomalies) {
          setAnomalies(anomaliesResponse.value.data.anomalies);
        }

        // Handle forecast data
        if (forecastResponse.status === 'fulfilled' && forecastResponse.value?.data?.forecast) {
          setForecastData(forecastResponse.value.data.forecast);
        }

        setLastUpdated(new Date());
        setIsLoading(false);
        console.log('✅ Data loaded successfully');
        
      } catch (error) {
        console.error('❌ Failed to load data:', error);
        // Initialize with empty data and continue
        setSalesData([]);
        setStockRecommendations([]);
        setRouteData([]);
        setAnomalies([]);
        setLastUpdated(new Date());
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'forecasting':
        return <ForecastingSection 
          forecastData={forecastData}
          selectedWarehouse={selectedWarehouse}
          selectedSku={selectedSku}
          onWarehouseChange={setSelectedWarehouse}
          onSkuChange={setSelectedSku}
          forecastHorizon={forecastHorizon}
          onHorizonChange={setForecastHorizon}
        />;
      case 'inventory':
        return <InventorySection stockRecommendations={stockRecommendations} />;
      case 'routes':
        return <RoutesSection routeData={routeData} onRefreshRoutes={refreshRouteData} />;
      case 'anomalies':
        return <AnomaliesSection 
          anomalies={anomalies}
          selectedWarehouse={selectedWarehouse}
          selectedSku={selectedSku}
          salesData={salesData}
        />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading SupplyNet</h2>
          <p className="text-gray-600">Connecting to AI backend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveSection('forecasting')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'forecasting'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Forecasting
            </button>
            <button
              onClick={() => setActiveSection('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveSection('routes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'routes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Routes
            </button>
            <button
              onClick={() => setActiveSection('anomalies')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'anomalies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Anomalies
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveSection()}
      </main>
    </div>
  );
}

export default App;