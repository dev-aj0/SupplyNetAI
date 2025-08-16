import { 
  SalesData, 
  ForecastData, 
  StockRecommendation, 
  RouteData, 
  Anomaly, 
  Warehouse, 
  DeliveryStop 
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

class APIService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // AI-Powered Forecasting
  async generateForecast(warehouseId: string, skuId: string, horizonDays: number = 7): Promise<any> {
    const params = new URLSearchParams({
      warehouse_id: warehouseId,
      sku_id: skuId,
      horizon_days: horizonDays.toString()
    });
    return this.request(`/forecasting/forecast?${params.toString()}`, {
      method: 'POST'
    });
  }

  async trainForecastingModel(warehouseId: string, skuId: string, salesData: SalesData[]): Promise<any> {
    return this.request('/forecasting/train', {
      method: 'POST',
      body: JSON.stringify({ warehouse_id: warehouseId, sku_id: skuId, sales_data: salesData }),
    });
  }

  async getForecastingModels(): Promise<any> {
    return this.request('/forecasting/models/list');
  }

  // AI-Powered Stock Optimization
  async getStockRecommendations(warehouseId: string, skuId: string): Promise<any> {
    const params = new URLSearchParams({
      warehouse_id: warehouseId,
      sku_id: skuId
    });
    return this.request(`/optimization/stock/recommendations?${params.toString()}`, {
      method: 'POST'
    });
  }

  async performStockWhatIf(warehouseId: string, skuId: string, scenario: string): Promise<any> {
    return this.request('/optimization/stock/what-if', {
      method: 'POST',
      body: JSON.stringify({ warehouse_id: warehouseId, sku_id: skuId, scenario }),
    });
  }

  async getGlobalStockAnalytics(): Promise<any> {
    return this.request('/optimization/stock/analytics/global');
  }

  // AI-Powered Anomaly Detection
  async detectAnomalies(warehouseId: string, skuId: string): Promise<any> {
    return this.request('/anomalies/detect', {
      method: 'POST',
      body: JSON.stringify({ warehouse_id: warehouseId, sku_id: skuId }),
    });
  }

  async listAnomalies(warehouseId?: string, skuId?: string, severity?: string): Promise<any> {
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouse_id', warehouseId);
    if (skuId) params.append('sku_id', skuId);
    if (severity) params.append('severity', severity);
    
    return this.request(`/anomalies/list?${params.toString()}`);
  }

  async getAnomalySummary(): Promise<any> {
    return this.request('/anomalies/analytics/summary');
  }

  // AI-Powered Route Optimization
  async optimizeRoutes(warehouseId: string, deliveryPoints: DeliveryStop[]): Promise<any> {
    return this.request('/routing/optimize', {
      method: 'POST',
      body: JSON.stringify({ warehouse_id: warehouseId, delivery_points: deliveryPoints }),
    });
  }

  async performRouteWhatIf(warehouseId: string, deliveryPoints: DeliveryStop[], scenario: string): Promise<any> {
    return this.request('/routing/what-if', {
      method: 'POST',
      body: JSON.stringify({ warehouse_id: warehouseId, delivery_points: deliveryPoints, scenario }),
    });
  }

  async getGlobalRoutingAnalytics(): Promise<any> {
    return this.request('/routing/analytics/global');
  }

  // Dashboard and Analytics
  async getDashboardOverview(): Promise<any> {
    return this.request('/overview');
  }

  async getSalesData(warehouseId?: string, skuId?: string, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouse_id', warehouseId);
    if (skuId) params.append('sku_id', skuId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    return this.request(`/sales-data?${params.toString()}`);
  }

  // AI Service Status
  async getAIStatus(): Promise<any> {
    return fetch('http://localhost:8000/ai-status').then(res => res.json());
  }

  // Legacy methods for backward compatibility
  async getSalesDataLegacy(): Promise<any> {
    return this.getSalesData();
  }

  async ingestSalesData(dataSource: string, options: any = {}): Promise<any> {
    return this.request('/ingest', {
      method: 'POST',
      body: JSON.stringify({ data_source: dataSource, ...options }),
    });
  }

  async uploadCSV(file: File): Promise<any> {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_BASE_URL}/upload/csv`, {
      method: 'POST',
      body: form,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async validateDataQuality(salesData: SalesData[]): Promise<any> {
    return this.request('/validate-quality', {
      method: 'POST',
      body: JSON.stringify({ sales_data: salesData }),
    });
  }

  async generateSyntheticData(warehouseCount: number = 5, skuCount: number = 20, days: number = 365): Promise<any> {
    return this.request('/synthetic-data', {
      method: 'POST',
      body: JSON.stringify({ 
        warehouse_count: warehouseCount, 
        sku_count: skuCount, 
        days: days 
      }),
    });
  }

  async trainForecastingModelLegacy(warehouseId: string, skuId: string, salesData: SalesData[]): Promise<any> {
    return this.trainForecastingModel(warehouseId, skuId, salesData);
  }

  async generateForecastLegacy(warehouseId: string, skuId: string, horizonDays: number = 7): Promise<any> {
    return this.generateForecast(warehouseId, skuId, horizonDays);
  }

  async optimizeWithStops(warehouseData: any, stops: DeliveryStop[]): Promise<any> {
    return this.optimizeRoutes(warehouseData.warehouse_id, stops);
  }
}

export const apiService = new APIService();
