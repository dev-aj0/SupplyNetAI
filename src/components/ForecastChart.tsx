import React from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { ForecastData } from '../types';

interface ForecastChartProps {
  data: ForecastData[];
}

const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Safety check for undefined or empty data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">No forecast data available</div>
          <div className="text-sm">Try a different Warehouse/SKU or refresh</div>
        </div>
      </div>
    );
  }

  const chartData = data.map(item => ({
    date: formatDate(item.date),
    predicted_demand: Number(item.predicted_demand ?? 0),
    confidence_lower: Number(item.confidence_lower ?? 0),
    confidence_upper: Number(item.confidence_upper ?? 0),
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          
          {/* Confidence interval area */}
          <Area
            type="monotone"
            dataKey="confidence_upper"
            stackId="1"
            stroke="none"
            fill="#dbeafe"
            fillOpacity={0.3}
            name="Confidence Upper"
          />
          <Area
            type="monotone"
            dataKey="confidence_lower"
            stackId="1"
            stroke="none"
            fill="white"
            fillOpacity={1}
            name="Confidence Lower"
          />
          
          {/* Confidence interval lines for better visibility */}
          <Line
            type="monotone"
            dataKey="confidence_upper"
            stroke="#3b82f6"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            name="Confidence Upper"
          />
          <Line
            type="monotone"
            dataKey="confidence_lower"
            stroke="#3b82f6"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            name="Confidence Lower"
          />
          
          {/* Predicted demand line */}
          <Line
            type="monotone"
            dataKey="predicted_demand"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
            name="Predicted Demand"
          />
          
          {/* Actual demand line (if available) */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#059669"
            strokeWidth={2}
            dot={{ fill: '#059669', strokeWidth: 2, r: 3 }}
            strokeDasharray="5 5"
            name="Actual Demand"
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span>Predicted Demand</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
          <span>Confidence Interval</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-0.5 h-3 bg-blue-600 border-l-2 border-dashed"></div>
          <span>Confidence Bounds</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-green-600"></div>
          <span>Actual (Historical)</span>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;