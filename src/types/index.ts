export interface SalesData {
  date: string;
  warehouse_id: string;
  sku_id: string;
  units_sold: number;
  order_id?: string;
  client_id?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface ForecastData {
  date: string;
  predicted_demand: number;
  confidence_lower: number;
  confidence_upper: number;
  actual?: number;
  model_confidence?: number;
  pattern_factors?: {
    seasonal: number;
    weekly: number;
    trend: number;
  };
}

export interface StockRecommendation {
  warehouse_id: string;
  sku_id: string;
  current_stock: number;
  safety_stock: number;
  reorder_point: number;
  recommended_order_qty: number;
  lead_time_days: number;
  status: 'urgent' | 'low' | 'optimal' | 'excess';
}

export interface RouteData {
  route_id: string;
  warehouse_id: string;
  stops: DeliveryStop[];
  total_distance: number;
  estimated_time: number;
  estimated_cost: number;
  efficiency_score: number;
}

export interface DeliveryStop {
  stop_id: string;
  client_id: string;
  customer_name: string;
  lat: number;
  lng: number;
  demand_qty: number;
  estimated_arrival: string;
  order: number;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  warehouse_id: string;
  sku_id: string;
  type: 'spike' | 'drop' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact_percentage: number;
  suggested_action: string;
}

export interface Warehouse {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  current_utilization: number;
}