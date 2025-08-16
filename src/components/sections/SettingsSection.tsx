import React, { useState } from 'react';
import { Settings, User, Bell, Database, Shield, Palette } from 'lucide-react';

const SettingsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  // Local theme state to avoid dependency on external ThemeProvider
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const actualTheme = theme === 'auto'
    ? (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light')
    : theme;
  const [settings, setSettings] = useState({
    general: {
      companyName: 'Supplynet Corp',
      timezone: 'America/New_York',
      currency: 'USD',
      language: 'English'
    },
    forecasting: {
      forecastHorizon: 7,
      confidenceLevel: 95,
      seasonalityDetection: true,
      trendAnalysis: true
    },
    inventory: {
      safetyStockMultiplier: 1.5,
      reorderPointDays: 14,
      autoReorderEnabled: false,
      lowStockThreshold: 20
    },
    routes: {
      optimizationGoal: 'balanced',
      maxRouteTime: 480,
      vehicleCapacity: 1000,
      trafficConsideration: true
    }
  });

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'forecasting', name: 'Forecasting', icon: Database },
    { id: 'inventory', name: 'Inventory', icon: User },
    { id: 'routes', name: 'Routes', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette }
  ];

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure system preferences and optimization parameters</p>
      </div>

      <div className="flex space-x-6">
        {/* Sidebar */}
        <div className="w-64 bg-card rounded-xl shadow-sm border">
          <nav className="p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                        : 'text-secondary hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-card rounded-xl shadow-sm p-6 border">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-primary">General Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Company Name</label>
                  <input
                    type="text"
                    value={settings.general.companyName}
                    onChange={(e) => updateSetting('general', 'companyName', e.target.value)}
                    className="block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-card text-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Timezone</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                    className="block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-card text-primary"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Currency</label>
                  <select
                    value={settings.general.currency}
                    onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                    className="block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-card text-primary"
                  >
                    <option value="USD">US Dollar</option>
                    <option value="EUR">Euro</option>
                    <option value="GBP">British Pound</option>
                    <option value="CAD">Canadian Dollar</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Language</label>
                  <select
                    value={settings.general.language}
                    onChange={(e) => updateSetting('general', 'language', e.target.value)}
                    className="block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-card text-primary"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'forecasting' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Forecasting Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forecast Horizon (days): {settings.forecasting.forecastHorizon}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={settings.forecasting.forecastHorizon}
                    onChange={(e) => updateSetting('forecasting', 'forecastHorizon', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confidence Level: {settings.forecasting.confidenceLevel}%
                  </label>
                  <input
                    type="range"
                    min="80"
                    max="99"
                    value={settings.forecasting.confidenceLevel}
                    onChange={(e) => updateSetting('forecasting', 'confidenceLevel', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Seasonality Detection</h3>
                    <p className="text-sm text-gray-500">Automatically detect seasonal patterns in demand</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.forecasting.seasonalityDetection}
                      onChange={(e) => updateSetting('forecasting', 'seasonalityDetection', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Trend Analysis</h3>
                    <p className="text-sm text-gray-500">Include trend analysis in forecasting models</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.forecasting.trendAnalysis}
                      onChange={(e) => updateSetting('forecasting', 'trendAnalysis', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Inventory Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Safety Stock Multiplier: {settings.inventory.safetyStockMultiplier}x
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={settings.inventory.safetyStockMultiplier}
                    onChange={(e) => updateSetting('inventory', 'safetyStockMultiplier', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reorder Point (days): {settings.inventory.reorderPointDays}
                  </label>
                  <input
                    type="range"
                    min="7"
                    max="30"
                    value={settings.inventory.reorderPointDays}
                    onChange={(e) => updateSetting('inventory', 'reorderPointDays', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Auto-Reorder</h3>
                    <p className="text-sm text-gray-500">Automatically generate purchase orders when stock is low</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.inventory.autoReorderEnabled}
                      onChange={(e) => updateSetting('inventory', 'autoReorderEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'routes' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Route Optimization Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Optimization Goal</label>
                  <select
                    value={settings.routes.optimizationGoal}
                    onChange={(e) => updateSetting('routes', 'optimizationGoal', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="distance">Minimize Distance</option>
                    <option value="time">Minimize Time</option>
                    <option value="cost">Minimize Cost</option>
                    <option value="balanced">Balanced</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Route Time (minutes): {settings.routes.maxRouteTime}
                  </label>
                  <input
                    type="range"
                    min="240"
                    max="720"
                    step="30"
                    value={settings.routes.maxRouteTime}
                    onChange={(e) => updateSetting('routes', 'maxRouteTime', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Traffic Consideration</h3>
                    <p className="text-sm text-gray-500">Include real-time traffic data in route optimization</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.routes.trafficConsideration}
                      onChange={(e) => updateSetting('routes', 'trafficConsideration', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800">Two-Factor Authentication</h3>
                  <p className="text-sm text-yellow-700 mt-1">Enhance account security with 2FA</p>
                  <button className="mt-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors">
                    Enable 2FA
                  </button>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800">API Access</h3>
                  <p className="text-sm text-blue-700 mt-1">Manage API keys and access tokens</p>
                  <button className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    Manage API Keys
                  </button>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-800">Data Encryption</h3>
                  <p className="text-sm text-green-700 mt-1">All data is encrypted at rest and in transit</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-primary">Appearance Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-primary mb-3">Theme</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 hover:border-blue-500'
                      }`}
                      onClick={() => setTheme('light')}
                    >
                      <div className="w-full h-16 bg-white border border-gray-200 rounded mb-2"></div>
                      <p className="text-xs text-center text-primary">Light</p>
                    </div>
                    <div 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 hover:border-blue-500'
                      }`}
                      onClick={() => setTheme('dark')}
                    >
                      <div className="w-full h-16 bg-gray-900 rounded mb-2"></div>
                      <p className="text-xs text-center text-primary">Dark</p>
                    </div>
                    <div 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        theme === 'auto' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 hover:border-blue-500'
                      }`}
                      onClick={() => setTheme('auto')}
                    >
                      <div className="w-full h-16 bg-gradient-to-r from-white to-gray-900 rounded mb-2"></div>
                      <p className="text-xs text-center text-primary">Auto</p>
                    </div>
                  </div>
                  <p className="text-xs text-secondary mt-2">
                    Current theme: {actualTheme} {theme === 'auto' && '(auto-detected)'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-primary mb-3">Accent Color</h3>
                  <div className="flex space-x-2">
                    {[
                      { name: 'blue', class: 'bg-blue-500' },
                      { name: 'green', class: 'bg-green-500' },
                      { name: 'purple', class: 'bg-purple-500' },
                      { name: 'red', class: 'bg-red-500' },
                      { name: 'yellow', class: 'bg-yellow-500' },
                      { name: 'indigo', class: 'bg-indigo-500' }
                    ].map(color => (
                      <div
                        key={color.name}
                        className={`w-8 h-8 rounded-full cursor-pointer border-2 ${color.class} ${
                          color.name === 'blue' ? 'border-gray-400' : 'border-transparent'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button className="btn-secondary px-4 py-2 rounded-lg transition-colors">
                Reset to Defaults
              </button>
              <button className="btn-primary px-4 py-2 rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;