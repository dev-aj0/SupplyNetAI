import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { SalesData, DeliveryStop, StockRecommendation } from '../types';
import { apiService } from '../services/api';

interface DataUploadProps {
  onUpload: (data: SalesData[]) => void;
  onUploadStops?: (stops: DeliveryStop[]) => void;
  onUploadInventory?: (recs: StockRecommendation[]) => void;
  onClose: () => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onUpload, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'sales' | 'stops' | 'inventory'>('sales');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setUploadStatus('processing');
    setErrorMessage('');

    try {
      // Validate file type
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(fileExtension)) {
        throw new Error('Invalid file type. Please upload a CSV or Excel file.');
      }

      if (mode === 'sales') {
        // Send CSV directly to backend for ingestion
        const result = await apiService.uploadCSV(file);
        const ingested = result?.result?.result?.data || result?.result?.data || result?.data || [];
        setUploadStatus('success');
        setTimeout(() => {
          onUpload(ingested as SalesData[]);
        }, 600);
      } else if (mode === 'stops') {
        // Client-side parse for stops (simple CSV parser)
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const header = lines.shift() || '';
        const cols = header.split(',').map(c => c.trim());
        const idx = (name: string) => cols.findIndex(c => c.toLowerCase() === name.toLowerCase());
        const stopIdIdx = idx('stop_id');
        const custIdx = idx('customer_name');
        const latIdx = idx('lat');
        const lngIdx = idx('lng');
        const demIdx = idx('demand_qty');
        // Minimal validation
        if (stopIdIdx < 0 || latIdx < 0 || lngIdx < 0) {
          throw new Error('routes_stops CSV must include at least: stop_id, lat, lng');
        }
        const stops: DeliveryStop[] = lines.map((line, i) => {
          const parts = line.split(',');
          return {
            stop_id: parts[stopIdIdx]?.trim() || `STOP_${i+1}`,
            client_id: `CL_${i+1}`,
            customer_name: custIdx >= 0 ? (parts[custIdx]?.trim() || `Customer ${i+1}`) : `Customer ${i+1}`,
            lat: Number(parts[latIdx] || 0),
            lng: Number(parts[lngIdx] || 0),
            demand_qty: demIdx >= 0 ? Number(parts[demIdx] || 0) : 0,
            estimated_arrival: new Date().toISOString(),
            order: i + 1,
          };
        });
        setUploadStatus('success');
        setTimeout(() => {
          onUploadStops && onUploadStops(stops);
        }, 600);
      } else {
        // inventory CSV parse
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const header = lines.shift() || '';
        const cols = header.split(',').map(c => c.trim());
        const idx = (name: string) => cols.findIndex(c => c.toLowerCase() === name.toLowerCase());
        const wIdx = idx('warehouse_id');
        const sIdx = idx('sku_id');
        const csIdx = idx('current_stock');
        const ltIdx = idx('lead_time_days');
        const slIdx = idx('target_service_level');
        if (wIdx < 0 || sIdx < 0 || csIdx < 0) {
          throw new Error('inventory CSV must include: warehouse_id, sku_id, current_stock');
        }
        const recs: StockRecommendation[] = lines.map((line) => {
          const parts = line.split(',');
          const current = Number(parts[csIdx] || 0);
          const lead = ltIdx >= 0 ? Number(parts[ltIdx] || 7) : 7;
          const service = slIdx >= 0 ? Number(parts[slIdx] || 0.95) : 0.95;
          // Simple defaults for MVP
          const safety = Math.round(current * 0.2);
          const reorder = Math.round(current * 0.5);
          const recoQty = Math.max(0, reorder + safety - current);
          const status: StockRecommendation['status'] = current < reorder ? 'urgent' : (current < reorder + safety ? 'low' : (current < current + safety ? 'optimal' : 'excess'));
          return {
            warehouse_id: parts[wIdx]?.trim() || 'WH',
            sku_id: parts[sIdx]?.trim() || 'SKU',
            current_stock: current,
            safety_stock: safety,
            reorder_point: reorder,
            recommended_order_qty: recoQty,
            lead_time_days: lead,
            status,
          };
        });
        setUploadStatus('success');
        setTimeout(() => {
          onUploadInventory && onUploadInventory(recs);
        }, 600);
      }

    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred while processing the file.');
    }
  };

  const handleGenerateSample = () => {
    setUploadStatus('processing');
    
    setTimeout(() => {
      setUploadStatus('success');
      
      setTimeout(() => {
        onUpload([]);
      }, 1000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upload Sales Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mr-3">Upload type:</label>
            <label className="mr-4"><input type="radio" checked={mode==='sales'} onChange={() => setMode('sales')} className="mr-1"/> Sales</label>
            <label><input type="radio" checked={mode==='stops'} onChange={() => setMode('stops')} className="mr-1"/> Route Stops</label>
          </div>
          {uploadStatus === 'idle' && (
            <>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your file here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Select File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              <div className="mt-6">
                <div className="text-sm text-gray-500 mb-3">
                  {mode==='sales' ? 'Expected sales CSV columns:' : 'Expected routes_stops CSV columns:'}
                </div>
                <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-700">
                  {mode==='sales' ? 'date, warehouse_id, sku_id, units_sold, order_id, client_id, location_lat, location_lng' : 'stop_id, customer_name, lat, lng, demand_qty, tw_start, tw_end, service_minutes'}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleGenerateSample}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Sample CSV
                </button>
              </div>
            </>
          )}

          {uploadStatus === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900 mb-2">Processing...</p>
              <p className="text-sm text-gray-500">Validating and importing your data</p>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Upload Successful!</p>
              <p className="text-sm text-gray-500">Your {mode==='sales' ? 'sales' : 'route stops'} data has been processed</p>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Upload Failed</p>
              <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
              <button
                onClick={() => setUploadStatus('idle')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataUpload;