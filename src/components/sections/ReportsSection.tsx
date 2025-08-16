import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, BarChart3, TrendingUp, Brain, Zap } from 'lucide-react';
import { apiService } from '../../services/api';

const ReportsSection: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('demand_forecast');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState([
    { id: 1, name: 'Weekly Demand Forecast', type: 'PDF', date: '2024-12-15', size: '2.3 MB' },
    { id: 2, name: 'Inventory Optimization Report', type: 'Excel', date: '2024-12-14', size: '1.8 MB' },
    { id: 3, name: 'Route Performance Analysis', type: 'PDF', date: '2024-12-13', size: '3.1 MB' },
    { id: 4, name: 'Monthly Executive Summary', type: 'PDF', date: '2024-12-01', size: '1.2 MB' }
  ]);

  const reportTypes = [
    { id: 'demand_forecast', name: 'Demand Forecast Report', description: 'Detailed demand predictions and accuracy metrics' },
    { id: 'inventory_analysis', name: 'Inventory Analysis', description: 'Stock levels, turnover rates, and optimization recommendations' },
    { id: 'route_performance', name: 'Route Performance', description: 'Delivery efficiency, costs, and optimization results' },
    { id: 'anomaly_summary', name: 'Anomaly Summary', description: 'Detected anomalies and their business impact' },
    { id: 'financial_impact', name: 'Financial Impact', description: 'Cost savings and ROI from optimization' },
    { id: 'executive_summary', name: 'Executive Summary', description: 'High-level KPIs and strategic insights' }
  ];

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('🚀 Generating AI report:', selectedReport);
      
      // Call real AI backend to generate report
      const response = await apiService.generateReport(selectedReport, dateRange);
      
      if (response?.data?.report_url) {
        console.log('✅ AI report generated successfully');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Add to recent reports
        const newReport = {
          id: Date.now(),
          name: reportTypes.find(r => r.id === selectedReport)?.name || 'AI Report',
          type: exportFormat.toUpperCase(),
          date: new Date().toISOString().split('T')[0],
          size: 'Generated'
        };
        setRecentReports([newReport, ...recentReports.slice(0, 3)]);
      } else {
        throw new Error('No report generated from AI backend');
      }
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      setError('Failed to generate AI report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteReport = (reportId: number) => {
    setRecentReports(recentReports.filter(r => r.id !== reportId));
  };

  const exportQuickData = async (dataType: string, format: string) => {
    try {
      console.log('📊 Exporting quick data:', dataType, format);
      
      // Call real AI backend for data export
      const response = await apiService.exportData(dataType, format);
      
      if (response?.data?.download_url) {
        // Download the file
        const link = document.createElement('a');
        link.href = response.data.download_url;
        link.download = `${dataType}_data.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('No download URL received');
      }
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      setError('Failed to export data. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI-Powered Reports</h1>
        <p className="text-gray-600">Generate comprehensive reports using AI analysis and insights</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">AI report generated successfully!</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Generation Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {reportTypes.map(report => (
                <option key={report.id} value={report.id}>
                  {report.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Export Tools */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Export Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => exportQuickData('forecast', 'csv')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Forecast Data</div>
            <div className="text-xs text-gray-500">CSV Export</div>
          </button>

          <button
            onClick={() => exportQuickData('stock', 'excel')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Stock Levels</div>
            <div className="text-xs text-gray-500">Excel Export</div>
          </button>

          <button
            onClick={() => exportQuickData('routes', 'json')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Route Data</div>
            <div className="text-xs text-gray-500">JSON Export</div>
          </button>

          <button
            onClick={() => exportQuickData('anomalies', 'csv')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Anomalies</div>
            <div className="text-xs text-gray-500">CSV Export</div>
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentReports.map((report) => (
            <div key={report.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{report.name}</div>
                  <div className="text-xs text-gray-500">{report.type} • {report.date} • {report.size}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Download
                </button>
                <button
                  onClick={() => deleteReport(report.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsSection;