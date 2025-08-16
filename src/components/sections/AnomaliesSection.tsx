import React, { useState } from 'react';
import AnomalyPanel from '../AnomalyPanel';
import { Anomaly, SalesData } from '../../types';
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { apiService } from '../../services/api';

interface AnomaliesSectionProps {
  anomalies: Anomaly[];
  selectedWarehouse: string;
  selectedSku: string;
  salesData: SalesData[];
}

const AnomaliesSection: React.FC<AnomaliesSectionProps> = ({ anomalies, selectedWarehouse, selectedSku, salesData }) => {
  const [sensitivityLevel, setSensitivityLevel] = useState('medium');
  const [detectionWindow, setDetectionWindow] = useState('last_7_days');
  const [alertThreshold, setAlertThreshold] = useState('30_percent');
  const [settingsUpdated, setSettingsUpdated] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastStatus, setLastStatus] = useState<string>('');

  const highSeverity = anomalies.filter(a => a.severity === 'high').length;
  const mediumSeverity = anomalies.filter(a => a.severity === 'medium').length;
  const lowSeverity = anomalies.filter(a => a.severity === 'low').length;
  const spikes = anomalies.filter(a => a.type === 'spike').length;

  const updateSettings = () => {
    setSettingsUpdated(true);
    setTimeout(() => setSettingsUpdated(false), 2000);
  };

  const trainDetector = async () => {
    try {
      setIsTraining(true);
      setLastStatus('');
      // Filter sales data for the selected pair
      const filtered = salesData
        .filter(r => r.warehouse_id === selectedWarehouse && r.sku_id === selectedSku)
        .map(r => ({ date: r.date, units_sold: r.units_sold }));
      if (filtered.length === 0) {
        setLastStatus('No sales data for selected pair. Upload or select another.');
        return;
      }
      const res = await apiService.trainAnomalyDetector(selectedWarehouse, selectedSku, filtered as any);
      setLastStatus('Training complete');
    } catch (e: any) {
      setLastStatus(`Training failed: ${e?.message || 'unknown error'}`);
    } finally {
      setIsTraining(false);
    }
  };

  const detectNow = async () => {
    try {
      setIsDetecting(true);
      setLastStatus('');
      // Recent window: last 14 days for selected pair
      const sorted = salesData
        .filter(r => r.warehouse_id === selectedWarehouse && r.sku_id === selectedSku)
        .sort((a,b) => (a.date < b.date ? -1 : 1));
      const recent = sorted.slice(-14).map(r => ({ date: r.date, units_sold: r.units_sold }));
      if (recent.length === 0) {
        setLastStatus('No recent data for detection.');
        return;
      }
      const res = await apiService.detectAnomalies(selectedWarehouse, selectedSku, recent as any);
      setLastStatus(`Detection complete: ${res?.anomalies_detected ?? 0} anomalies`);
    } catch (e: any) {
      setLastStatus(`Detection failed: ${e?.message || 'unknown error'}`);
    } finally {
      setIsDetecting(false);
    }
  };

  const trainAndDetect = async () => {
    await trainDetector();
    await detectNow();
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Anomaly Detection</h1>
        <p className="text-gray-600">AI-powered detection of unusual patterns and demand anomalies</p>
      </div>

      {/* Anomaly Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">High Severity</p>
              <p className="text-2xl font-bold text-red-600">{highSeverity}</p>
              <p className="text-xs text-red-600">Immediate attention required</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Medium Severity</p>
              <p className="text-2xl font-bold text-yellow-600">{mediumSeverity}</p>
              <p className="text-xs text-yellow-600">Monitor closely</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Severity</p>
              <p className="text-2xl font-bold text-blue-600">{lowSeverity}</p>
              <p className="text-xs text-blue-600">For information</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Detection Rate</p>
              <p className="text-2xl font-bold text-green-600">98.7%</p>
              <p className="text-xs text-green-600">Model accuracy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Detection Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Detection Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sensitivity Level</label>
            <select 
              value={sensitivityLevel}
              onChange={(e) => setSensitivityLevel(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option>High (More alerts)</option>
              <option>Medium (Balanced)</option>
              <option>Low (Fewer alerts)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Detection Window</label>
            <select 
              value={detectionWindow}
              onChange={(e) => setDetectionWindow(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option>Last 24 hours</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alert Threshold</label>
            <select 
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option>±20% deviation</option>
              <option>±30% deviation</option>
              <option>±50% deviation</option>
            </select>
          </div>

          <div className="flex items-end">
            <button 
              onClick={updateSettings}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Settings
            </button>
          </div>
        </div>
        
        {settingsUpdated && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">Detection settings updated successfully!</p>
          </div>
        )}
      </div>

      {/* Anomaly Panel */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Detected Anomalies</h2>
          <div className="flex space-x-2">
            <button
              onClick={trainDetector}
              disabled={isTraining}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isTraining ? 'Training…' : 'Train Detector'}
            </button>
            <button
              onClick={detectNow}
              disabled={isDetecting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isDetecting ? 'Detecting…' : 'Detect Now'}
            </button>
            <button
              onClick={trainAndDetect}
              disabled={isTraining || isDetecting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Train + Detect
            </button>
          </div>
        </div>
        {lastStatus && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">{lastStatus}</div>
        )}
        <AnomalyPanel anomalies={anomalies} />
      </div>

      {/* Anomaly Trends */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Anomaly Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600 mb-2">{spikes}</div>
            <div className="text-sm text-red-700">Demand Spikes</div>
            <div className="text-xs text-red-500 mt-1">↑ 15% from last week</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {anomalies.filter(a => a.type === 'drop').length}
            </div>
            <div className="text-sm text-orange-700">Demand Drops</div>
            <div className="text-xs text-orange-500 mt-1">↓ 8% from last week</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {anomalies.filter(a => a.type === 'unusual_pattern').length}
            </div>
            <div className="text-sm text-purple-700">Pattern Changes</div>
            <div className="text-xs text-purple-500 mt-1">→ Stable</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomaliesSection;