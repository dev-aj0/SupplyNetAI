import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Settings } from 'lucide-react';

const AlertsSection: React.FC = () => {
  const [alertSettings, setAlertSettings] = useState({
    stockShortage: true,
    demandSpikes: true,
    routeDelays: true,
    anomalies: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'stock_shortage',
      severity: 'high',
      title: 'Critical Stock Shortage',
      message: 'SKU-ELEC-001 at WH001 has fallen below safety stock levels',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      actionRequired: true
    },
    {
      id: 2,
      type: 'demand_spike',
      severity: 'medium',
      title: 'Unusual Demand Spike',
      message: 'SKU-HOME-003 showing 150% increase in demand over last 24 hours',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      actionRequired: true
    },
    {
      id: 3,
      type: 'route_delay',
      severity: 'low',
      title: 'Route Delay',
      message: 'ROUTE-WH002 experiencing 15-minute delay due to traffic',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: true,
      actionRequired: false
    },
    {
      id: 4,
      type: 'system',
      severity: 'low',
      title: 'Forecast Updated',
      message: 'Weekly demand forecast has been updated with latest data',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: true,
      actionRequired: false
    }
  ]);
  const [settingsSaved, setSettingsSaved] = useState(false);


  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'stock_shortage': return <AlertTriangle className="w-5 h-5" />;
      case 'demand_spike': return <AlertTriangle className="w-5 h-5" />;
      case 'route_delay': return <Clock className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;
  const actionRequiredCount = alerts.filter(alert => alert.actionRequired).length;

  const markAllRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, read: true })));
  };

  const dismissAlert = (alertId: number) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const takeAction = (alertId: number) => {
    // Simulate taking action
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, actionRequired: false, read: true }
        : alert
    ));
  };

  const saveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
        <p className="text-gray-600">Real-time alerts and notification management</p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Bell className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unread Alerts</p>
              <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              <p className="text-xs text-red-600">Require attention</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Action Required</p>
              <p className="text-2xl font-bold text-yellow-600">{actionRequiredCount}</p>
              <p className="text-xs text-yellow-600">Need immediate action</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolved Today</p>
              <p className="text-2xl font-bold text-green-600">12</p>
              <p className="text-xs text-green-600">Issues addressed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Rules</p>
              <p className="text-2xl font-bold text-blue-600">8</p>
              <p className="text-xs text-blue-600">Monitoring conditions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
            <div className="flex space-x-2">
              <button 
                onClick={markAllRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark All Read
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Unread</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">High Priority</button>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-6 hover:bg-gray-50 transition-colors ${!alert.read ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${!alert.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {alert.title}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{formatTimestamp(alert.timestamp)}</span>
                      {!alert.read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                    </div>
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                  
                  {alert.actionRequired && (
                    <div className="mt-3 flex space-x-2">
                      <button 
                        onClick={() => takeAction(alert.id)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Take Action
                      </button>
                      <button 
                        onClick={() => dismissAlert(alert.id)}
                        className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Alert Types</h3>
            <div className="space-y-3">
              {Object.entries({
                stockShortage: 'Stock Shortage Alerts',
                demandSpikes: 'Demand Spike Alerts',
                routeDelays: 'Route Delay Alerts',
                anomalies: 'Anomaly Detection Alerts'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertSettings[key as keyof typeof alertSettings]}
                      onChange={(e) => setAlertSettings(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Delivery Methods</h3>
            <div className="space-y-3">
              {Object.entries({
                emailNotifications: 'Email Notifications',
                smsNotifications: 'SMS Notifications',
                pushNotifications: 'Push Notifications'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertSettings[key as keyof typeof alertSettings]}
                      onChange={(e) => setAlertSettings(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button 
            onClick={saveSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
          {settingsSaved && (
            <span className="ml-3 text-sm text-green-600">Settings saved!</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsSection;