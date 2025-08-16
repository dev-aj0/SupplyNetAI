import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteData } from '../types';
// Mock data constants (fallback when AI backend unavailable)
const WAREHOUSES = [
  { id: "WH001", name: "Warehouse 1", location: "New York", lat: 40.7128, lng: -74.0060, capacity: 10000, current_utilization: 0.75 },
  { id: "WH002", name: "Warehouse 2", location: "Los Angeles", lat: 34.0522, lng: -118.2437, capacity: 12000, current_utilization: 0.80 },
  { id: "WH003", name: "Warehouse 3", location: "Chicago", lat: 41.8781, lng: -87.6298, capacity: 8000, current_utilization: 0.65 },
  { id: "WH004", name: "Warehouse 4", location: "Houston", lat: 29.7604, lng: -95.3698, capacity: 9000, current_utilization: 0.70 },
  { id: "WH005", name: "Warehouse 5", location: "Phoenix", lat: 33.4484, lng: -112.0740, capacity: 11000, current_utilization: 0.85 }
];

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteMapProps {
  routes: RouteData[];
}

const RouteMap: React.FC<RouteMapProps> = ({ routes }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // Safety check for routes
  const safeRoutes = Array.isArray(routes) ? routes : [];

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([39.8283, -98.5795], 5);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    
    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Colors for different routes
    const routeColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    // Add warehouse markers
    WAREHOUSES.forEach((warehouse) => {
      const warehouseIcon = L.divIcon({
        html: `<div style="background-color: #1f2937; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">W</div>`,
        className: 'custom-warehouse-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker([warehouse.lat, warehouse.lng], { icon: warehouseIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${warehouse.name}</h3>
            <p class="text-sm text-gray-600">ID: ${warehouse.id}</p>
            <p class="text-sm text-gray-600">Capacity: ${warehouse.capacity.toLocaleString()}</p>
            <p class="text-sm text-gray-600">Utilization: ${Math.round(warehouse.current_utilization * 100)}%</p>
          </div>
        `);
    });

    // Add routes and stops
    safeRoutes.forEach((route, routeIndex) => {
      const color = routeColors[routeIndex % routeColors.length];
      const warehouse = WAREHOUSES.find(w => w.id === route.warehouse_id);
      
      if (!warehouse) return;

      // Safety check for route.stops
      if (!route.stops || !Array.isArray(route.stops)) {
        console.warn('Route missing stops array:', route);
        return;
      }

      // Create route path with safety checks
      const routeCoordinates: [number, number][] = [
        [warehouse.lat, warehouse.lng],
        ...route.stops
          .filter(stop => stop && typeof stop.lat === 'number' && typeof stop.lng === 'number')
          .map(stop => [stop.lat, stop.lng] as [number, number])
      ];

      // Add route polyline
      L.polyline(routeCoordinates, {
        color: color,
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(map).bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">Route ${route.route_id || 'Unknown'}</h3>
          <p class="text-sm text-gray-600">Distance: ${route.total_distance || 0} miles</p>
          <p class="text-sm text-gray-600">Time: ${route.estimated_time || 0} minutes</p>
          <p class="text-sm text-gray-600">Cost: $${route.estimated_cost || 0}</p>
          <p class="text-sm text-gray-600">Efficiency: ${route.efficiency_score || 0}%</p>
        </div>
      `);

      // Add stop markers
      route.stops.forEach((stop) => {
        // Safety check for stop coordinates
        if (!stop || typeof stop.lat !== 'number' || typeof stop.lng !== 'number') {
          console.warn('Stop missing valid coordinates:', stop);
          return;
        }

        const stopIcon = L.divIcon({
          html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${stop.order || '?'}</div>`,
          className: 'custom-stop-icon',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        L.marker([stop.lat, stop.lng], { icon: stopIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-gray-900">${stop.customer_name || 'Unknown Customer'}</h3>
              <p class="text-sm text-gray-600">Stop #${stop.order || '?'}</p>
              <p class="text-sm text-gray-600">Demand: ${stop.demand_qty || 0} units</p>
              <p class="text-sm text-gray-600">ETA: ${stop.estimated_arrival ? new Date(stop.estimated_arrival).toLocaleTimeString() : 'Unknown'}</p>
            </div>
          `);
      });
    });

    // Fit map to show all markers
    if (safeRoutes.length > 0) {
      const group = new L.FeatureGroup();
      
      WAREHOUSES.forEach(warehouse => {
        group.addLayer(L.marker([warehouse.lat, warehouse.lng]));
      });
      
      safeRoutes.forEach(route => {
        if (route.stops && Array.isArray(route.stops)) {
          route.stops.forEach(stop => {
            if (stop && typeof stop.lat === 'number' && typeof stop.lng === 'number') {
              group.addLayer(L.marker([stop.lat, stop.lng]));
            }
          });
        }
      });
      
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      // Cleanup function
    };
  }, [routes]);

  return (
    <div className="space-y-4">
      {/* Route Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Routes</p>
              <p className="text-2xl font-bold text-blue-900">{safeRoutes.length}</p>
            </div>
            <div className="text-blue-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Distance</p>
              <p className="text-2xl font-bold text-green-900">
                {Math.round(safeRoutes.reduce((acc, route) => acc + (route.total_distance || 0), 0))} mi
              </p>
            </div>
            <div className="text-green-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Est. Cost Savings</p>
              <p className="text-2xl font-bold text-purple-900">
                ${Math.round(safeRoutes.reduce((acc, route) => acc + (route.estimated_cost || 0) * 0.15, 0))}
              </p>
            </div>
            <div className="text-purple-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <div ref={mapRef} className="h-96 w-full rounded-lg border border-gray-300" />
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-[1000]">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold">W</div>
              <span>Warehouse</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
              <span>Delivery Stop</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-blue-500" style={{ borderStyle: 'dashed' }}></div>
              <span>Route Path</span>
            </div>
          </div>
        </div>
      </div>

      {/* Route Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeRoutes.map((route) => (
          <div key={route.route_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">{route.route_id}</h3>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {route.stops ? route.stops.length : 0} stops
            </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Distance:</span>
                <span className="font-medium">{route.total_distance || 0} mi</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-medium">{route.estimated_time || 0} min</span>
              </div>
              <div className="flex justify-between">
                <span>Cost:</span>
                <span className="font-medium">${route.estimated_cost || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Efficiency:</span>
                <span className={`font-medium ${(route.efficiency_score || 0) >= 80 ? 'text-green-600' : (route.efficiency_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {route.efficiency_score || 0}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouteMap;