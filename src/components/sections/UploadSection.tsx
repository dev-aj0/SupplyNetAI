import React, { useState } from 'react';
import DataUpload from '../DataUpload';
import { SalesData } from '../../types';
import { Upload, FileText, Database, CheckCircle } from 'lucide-react';

interface UploadSectionProps {
  onDataUpload: (data: SalesData[]) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onDataUpload }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [apiConnections, setApiConnections] = useState({
    erp: { connected: true, lastSync: '2 minutes ago' },
    warehouse: { connected: false, lastSync: 'Never' },
    ecommerce: { connected: false, lastSync: 'Never' }
  });
  const [uploadHistory, setUploadHistory] = useState([
    { id: 1, filename: 'sales_data_2024_q4.csv', date: '2024-12-15', records: 15420, status: 'success' },
    { id: 2, filename: 'inventory_snapshot.xlsx', date: '2024-12-10', records: 8750, status: 'success' },
    { id: 3, filename: 'customer_orders.csv', date: '2024-12-05', records: 12300, status: 'success' }
  ]);

  const handleDataUpload = (data: SalesData[]) => {
    onDataUpload(data);
    setShowUpload(false);
    
    // Add to upload history
    const newUpload = {
      id: uploadHistory.length + 1,
      filename: 'uploaded_data.csv',
      date: new Date().toISOString().split('T')[0],
      records: data.length,
      status: 'success' as const
    };
    setUploadHistory([newUpload, ...uploadHistory]);
  };

  const connectAPI = (apiType: string) => {
    setApiConnections(prev => ({
      ...prev,
      [apiType]: { connected: true, lastSync: 'Just now' }
    }));
  };

  const configureAPI = (apiType: string) => {
    alert(`Opening ${apiType} API configuration...`);
  };

  const viewUploadDetails = (uploadId: number) => {
    const upload = uploadHistory.find(u => u.id === uploadId);
    if (upload) {
      alert(`Upload Details:\nFile: ${upload.filename}\nRecords: ${upload.records}\nDate: ${upload.date}\nStatus: ${upload.status}`);
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Upload & Integration</h1>
        <p className="text-gray-600">Import sales data, inventory snapshots, and customer information</p>
      </div>

      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">File Upload</h3>
              <p className="text-sm text-gray-600">CSV, Excel files</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Files
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">API Integration</h3>
              <p className="text-sm text-gray-600">Real-time data sync</p>
            </div>
          </div>
          <button
            onClick={() => configureAPI('general')}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Configure API
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Sample Data</h3>
              <p className="text-sm text-gray-600">Demo dataset</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Generate Sample
          </button>
        </div>
      </div>

      {/* Data Requirements */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Format Requirements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Sales Data Format</h3>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <div className="text-gray-600 mb-2">Required columns:</div>
              <div className="space-y-1">
                <div>• date (YYYY-MM-DD)</div>
                <div>• warehouse_id (string)</div>
                <div>• sku_id (string)</div>
                <div>• units_sold (number)</div>
              </div>
              <div className="text-gray-600 mt-3 mb-2">Optional columns:</div>
              <div className="space-y-1">
                <div>• order_id (string)</div>
                <div>• client_id (string)</div>
                <div>• location_lat (number)</div>
                <div>• location_lng (number)</div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Inventory Data Format</h3>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <div className="text-gray-600 mb-2">Required columns:</div>
              <div className="space-y-1">
                <div>• warehouse_id (string)</div>
                <div>• sku_id (string)</div>
                <div>• current_stock (number)</div>
                <div>• safety_stock (number)</div>
              </div>
              <div className="text-gray-600 mt-3 mb-2">Optional columns:</div>
              <div className="space-y-1">
                <div>• reorder_point (number)</div>
                <div>• lead_time_days (number)</div>
                <div>• unit_cost (number)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload History */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filename
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uploadHistory.map((upload) => (
                <tr key={upload.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {upload.filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(upload.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {upload.records.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Success
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => viewUploadDetails(upload.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Integration Status */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Integrations</h2>
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            apiConnections.erp.connected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              {apiConnections.erp.connected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
              )}
              <div>
                <p className="font-medium text-green-900">ERP System</p>
                <p className={`text-sm ${apiConnections.erp.connected ? 'text-green-700' : 'text-gray-700'}`}>
                  {apiConnections.erp.connected ? `Connected - Last sync: ${apiConnections.erp.lastSync}` : 'Not connected'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => configureAPI('erp')}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Configure
            </button>
          </div>
          
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            apiConnections.warehouse.connected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center space-x-3">
              {apiConnections.warehouse.connected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
              )}
              <div>
                <p className="font-medium text-yellow-900">Warehouse Management</p>
                <p className={`text-sm ${apiConnections.warehouse.connected ? 'text-green-700' : 'text-yellow-700'}`}>
                  {apiConnections.warehouse.connected ? `Connected - Last sync: ${apiConnections.warehouse.lastSync}` : 'Pending configuration'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => apiConnections.warehouse.connected ? configureAPI('warehouse') : connectAPI('warehouse')}
              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
            >
              {apiConnections.warehouse.connected ? 'Configure' : 'Setup'}
            </button>
          </div>
          
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            apiConnections.ecommerce.connected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              {apiConnections.ecommerce.connected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
              )}
              <div>
                <p className="font-medium text-gray-900">E-commerce Platform</p>
                <p className={`text-sm ${apiConnections.ecommerce.connected ? 'text-green-700' : 'text-gray-700'}`}>
                  {apiConnections.ecommerce.connected ? `Connected - Last sync: ${apiConnections.ecommerce.lastSync}` : 'Not connected'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => apiConnections.ecommerce.connected ? configureAPI('ecommerce') : connectAPI('ecommerce')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {apiConnections.ecommerce.connected ? 'Configure' : 'Connect'}
            </button>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <DataUpload
          onUpload={handleDataUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
};

export default UploadSection;