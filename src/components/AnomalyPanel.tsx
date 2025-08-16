import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';
import { Anomaly } from '../types';

interface AnomalyPanelProps {
  anomalies: Anomaly[];
}

const AnomalyPanel: React.FC<AnomalyPanelProps> = ({ anomalies }) => {
  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'spike':
        return <TrendingUp className="w-4 h-4" />;
      case 'drop':
        return <TrendingDown className="w-4 h-4" />;
      case 'unusual_pattern':
        return <Activity className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'spike':
        return 'text-red-600';
      case 'drop':
        return 'text-orange-600';
      case 'unusual_pattern':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (anomalies.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No anomalies detected</p>
        <p className="text-sm">All systems operating normally</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {anomalies.filter(a => a.severity === 'high').length}
          </div>
          <div className="text-xs text-gray-500">High Priority</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {anomalies.filter(a => a.severity === 'medium').length}
          </div>
          <div className="text-xs text-gray-500">Medium Priority</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {anomalies.filter(a => a.severity === 'low').length}
          </div>
          <div className="text-xs text-gray-500">Low Priority</div>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {anomalies.map((anomaly) => (
          <div
            key={anomaly.id}
            className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)} transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={getTypeColor(anomaly.type)}>
                  {getAnomalyIcon(anomaly.type)}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {anomaly.warehouse_id} / {anomaly.sku_id}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(anomaly.timestamp)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                  anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {anomaly.severity.toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {anomaly.impact_percentage > 0 ? '+' : ''}{anomaly.impact_percentage}%
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-3">
              {anomaly.description}
            </p>
            
            <div className="bg-white bg-opacity-50 rounded p-2 border border-gray-200">
              <div className="text-xs font-medium text-gray-600 mb-1">Suggested Action:</div>
              <div className="text-sm text-gray-800">{anomaly.suggested_action}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnomalyPanel;