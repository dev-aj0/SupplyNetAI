// Mock data generation functions (fallback when AI backend unavailable)
import { RouteData } from '../types';

export const WAREHOUSES = [
  { id: "WH001", name: "Warehouse 1", location: "New York", lat: 40.7128, lng: -74.0060, capacity: 10000, current_utilization: 0.75 },
  { id: "WH002", name: "Warehouse 2", location: "Los Angeles", lat: 34.0522, lng: -118.2437, capacity: 12000, current_utilization: 0.80 },
  { id: "WH003", name: "Warehouse 3", location: "Chicago", lat: 41.8781, lng: -87.6298, capacity: 8000, current_utilization: 0.65 },
  { id: "WH004", name: "Warehouse 4", location: "Houston", lat: 29.7604, lng: -95.3698, capacity: 9000, current_utilization: 0.70 },
  { id: "WH005", name: "Warehouse 5", location: "Phoenix", lat: 33.4484, lng: -112.0740, capacity: 11000, current_utilization: 0.85 }
];

export const SKUS = ["SKU001", "SKU002", "SKU003", "SKU004", "SKU005", "SKU006", "SKU007", "SKU008", "SKU009", "SKU010"];

export const generateSalesData = (days: number) => {
  const data = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    for (const warehouse of WAREHOUSES) {
      for (const sku of SKUS) {
        data.push({
          id: `sale_${i}_${warehouse.id}_${sku}`,
          date: date.toISOString().split('T')[0],
          warehouse_id: warehouse.id,
          sku_id: sku,
          units_sold: Math.floor(Math.random() * 100) + 10,
          revenue: Math.floor(Math.random() * 1000) + 100
        });
      }
    }
  }
  
  return data;
};

export const generateForecastData = (warehouseId: string, skuId: string, horizon: number = 7) => {
  const forecasts = [];
  const today = new Date();
  
  for (let i = 1; i <= horizon; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Generate more realistic forecast data with trends
    const baseDemand = 50 + (Math.sin(i * 0.3) * 20); // Cyclical pattern
    const trend = i * 2; // Slight upward trend
    const noise = (Math.random() - 0.5) * 15; // Random variation
    
    const predictedDemand = Math.max(10, Math.round(baseDemand + trend + noise));
    const confidenceRange = predictedDemand * 0.3; // 30% confidence interval
    
    forecasts.push({
      id: `forecast_${i}_${warehouseId}_${skuId}`,
      date: date.toISOString().split('T')[0],
      warehouse_id: warehouseId,
      sku_id: skuId,
      predicted_demand: predictedDemand,
      confidence_lower: Math.max(0, Math.round(predictedDemand - confidenceRange)),
      confidence_upper: Math.round(predictedDemand + confidenceRange),
      model_confidence: Math.max(0.7, 0.95 - (i * 0.02)) // Confidence decreases with time
    });
  }
  
  return forecasts;
};

export const generateStockRecommendations = () => {
  return WAREHOUSES.flatMap(warehouse => 
    SKUS.map(sku => ({
      warehouse_id: warehouse.id,
      sku_id: sku,
      current_stock: Math.floor(Math.random() * 500) + 100,
      safety_stock: Math.floor(Math.random() * 100) + 50,
      reorder_point: Math.floor(Math.random() * 200) + 50,
      recommended_order_qty: Math.floor(Math.random() * 300) + 100,
      lead_time_days: Math.floor(Math.random() * 14) + 3,
      status: (Math.random() > 0.8 ? 'urgent' : Math.random() > 0.6 ? 'low' : Math.random() > 0.4 ? 'optimal' : 'excess') as 'urgent' | 'low' | 'optimal' | 'excess'
    }))
  );
};

export const generateRouteData = () => {
  return [
    {
      route_id: 'route_1',
      warehouse_id: 'WH001',
      stops: [
        {
          stop_id: 'stop_1',
          client_id: 'client_1',
          customer_name: 'Customer A',
          lat: 40.7589,
          lng: -73.9851,
          demand_qty: 50,
          estimated_arrival: '2024-01-15T10:00:00Z',
          order: 1
        }
      ],
      total_distance: 25.5,
      estimated_time: 45,
      estimated_cost: 12.50,
      efficiency_score: 85
    },
    {
      route_id: 'route_2',
      warehouse_id: 'WH002',
      stops: [
        {
          stop_id: 'stop_2',
          client_id: 'client_2',
          customer_name: 'Customer B',
          lat: 34.0522,
          lng: -118.2437,
          demand_qty: 75,
          estimated_arrival: '2024-01-15T14:00:00Z',
          order: 1
        }
      ],
      total_distance: 18.2,
      estimated_time: 32,
      estimated_cost: 9.80,
      efficiency_score: 92
    }
  ];
};

export const generateAnomalies = () => {
  return [
    {
      id: 'anomaly_1',
      timestamp: new Date().toISOString(),
      warehouse_id: 'WH001',
      sku_id: 'SKU001',
      type: 'spike' as const,
      severity: 'medium' as const,
      description: 'Demand spike detected for SKU001 in WH001',
      impact_percentage: 25.5,
      suggested_action: 'Review inventory levels and consider restocking'
    }
  ];
};

export const generateSampleRouteData = (): RouteData[] => {
  return [
    {
      route_id: 'route-001',
      warehouse_id: 'WH001',
      total_distance: 45.2,
      estimated_time: 180,
      estimated_cost: 125.50,
      efficiency_score: 0.87,
      stops: [
        {
          stop_id: 'stop-001',
          client_id: 'client-001',
          customer_name: 'Customer A',
          lat: 40.7128,
          lng: -74.0060,
          demand_qty: 50,
          estimated_arrival: '2024-01-15T09:00:00Z',
          order: 1
        },
        {
          stop_id: 'stop-002',
          client_id: 'client-002',
          customer_name: 'Customer B',
          lat: 40.7589,
          lng: -73.9851,
          demand_qty: 75,
          estimated_arrival: '2024-01-15T10:30:00Z',
          order: 2
        }
      ]
    },
    {
      route_id: 'route-002',
      warehouse_id: 'WH002',
      total_distance: 32.8,
      estimated_time: 120,
      estimated_cost: 89.75,
      efficiency_score: 0.92,
      stops: [
        {
          stop_id: 'stop-003',
          client_id: 'client-003',
          customer_name: 'Customer C',
          lat: 34.0522,
          lng: -118.2437,
          demand_qty: 100,
          estimated_arrival: '2024-01-15T08:00:00Z',
          order: 1
        }
      ]
    }
  ];
};
