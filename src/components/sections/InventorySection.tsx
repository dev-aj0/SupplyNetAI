import React, { useState } from 'react';
import StockTable from '../StockTable';
import { StockRecommendation } from '../../types';
import { Package, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface InventorySectionProps {
  stockRecommendations: StockRecommendation[];
}

const InventorySection: React.FC<InventorySectionProps> = ({ stockRecommendations }) => {
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<StockRecommendation[]>([]);

  const urgentItems = stockRecommendations.filter(item => item.status === 'urgent').length;
  const lowItems = stockRecommendations.filter(item => item.status === 'low').length;
  const optimalItems = stockRecommendations.filter(item => item.status === 'optimal').length;
  const excessItems = stockRecommendations.filter(item => item.status === 'excess').length;

  const totalValue = stockRecommendations.reduce((sum, item) => 
    sum + ((item.recommended_order_qty || 0) * 25), 0); // Assuming $25 average cost per unit

  const generatePurchaseOrders = () => {
    const itemsNeedingOrders = stockRecommendations.filter(item => item.recommended_order_qty > 0);
    setSelectedItems(itemsNeedingOrders);
    setShowPOModal(true);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Warehouse', 'SKU', 'Current Stock', 'Safety Stock', 'Reorder Point', 'Recommended Order', 'Status'],
      ...stockRecommendations.map(item => [
        item.warehouse_id,
        item.sku_id,
        item.current_stock,
        item.safety_stock,
        item.reorder_point,
        item.recommended_order_qty,
        item.status
      ])
    ].map(row => row.join(',')).join('\n');

    const element = document.createElement('a');
    const file = new Blob([csvContent], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = 'stock_recommendations.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Optimization</h1>
        <p className="text-gray-600">AI-driven inventory recommendations and stock level optimization</p>
      </div>

      {/* Stock Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Urgent Restock</p>
              <p className="text-2xl font-bold text-red-600">{urgentItems}</p>
              <p className="text-xs text-red-600">Critical shortage risk</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{lowItems}</p>
              <p className="text-xs text-yellow-600">Below reorder point</p>
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
              <p className="text-sm font-medium text-gray-500">Optimal Stock</p>
              <p className="text-2xl font-bold text-green-600">{optimalItems}</p>
              <p className="text-xs text-green-600">Well balanced</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Excess Stock</p>
              <p className="text-2xl font-bold text-blue-600">{excessItems}</p>
              <p className="text-xs text-blue-600">Consider redistribution</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Impact */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Impact Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">${totalValue.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Recommended Order Value</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">${Math.round(totalValue * 0.15).toLocaleString()}</div>
            <div className="text-sm text-gray-500">Estimated Cost Savings</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">${Math.round(totalValue * 0.08).toLocaleString()}</div>
            <div className="text-sm text-gray-500">Carrying Cost Reduction</div>
          </div>
        </div>
      </div>

      {/* Stock Recommendations Table */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Stock Recommendations</h2>
          <div className="flex space-x-2">
            <button 
              onClick={generatePurchaseOrders}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate POs
            </button>
            <button 
              onClick={exportToCSV}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
        <StockTable data={stockRecommendations} />
      </div>

      {/* Items to Purchase - Clear List */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items to Purchase</h2>
        <div className="space-y-4">
          {stockRecommendations.filter(item => item.recommended_order_qty > 0).length > 0 ? (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-yellow-900">Purchase Required</p>
                    <p className="text-sm text-yellow-700">
                      The following items need to be ordered to maintain optimal stock levels
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product (SKU)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockRecommendations
                      .filter(item => item.recommended_order_qty > 0)
                      .sort((a, b) => {
                        // Sort by priority: urgent first, then by order quantity
                        if (a.status === 'urgent' && b.status !== 'urgent') return -1;
                        if (b.status === 'urgent' && a.status !== 'urgent') return 1;
                        return b.recommended_order_qty - a.recommended_order_qty;
                      })
                      .map((item, index) => (
                        <tr key={`${item.warehouse_id}-${item.sku_id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'urgent' ? 'bg-red-100 text-red-800' :
                              item.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {item.status === 'urgent' ? '🔴 Urgent' : 
                               item.status === 'low' ? '🟡 Low' : '🔵 Normal'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.warehouse_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{item.sku_id}</div>
                              <div className="text-xs text-gray-500">Product ID</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className={`w-3 h-3 rounded-full mr-2 ${
                                item.current_stock === 0 ? 'bg-red-500' :
                                item.current_stock < (item.safety_stock || 0) ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}></span>
                              {item.current_stock || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                            {item.recommended_order_qty || 0} units
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${((item.recommended_order_qty || 0) * 25).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.lead_time_days || 7} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button 
                              onClick={() => {
                                alert(`Creating purchase order for ${item.recommended_order_qty} units of ${item.sku_id} at ${item.warehouse_id}`);
                              }}
                              className="text-blue-600 hover:text-blue-900 font-medium px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                            >
                              Order Now
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Total Purchase Required</p>
                    <p className="text-xs text-blue-700">
                      {stockRecommendations.filter(item => item.recommended_order_qty > 0).length} items need ordering
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-900">
                      ${stockRecommendations
                        .filter(item => item.recommended_order_qty > 0)
                        .reduce((sum, item) => sum + ((item.recommended_order_qty || 0) * 25), 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-700">Total estimated cost</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-900">All Stock Levels Optimal</p>
              <p className="text-sm text-gray-600">No purchases required at this time</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Sources Information */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Data Sources</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-blue-900">Data Files Used</p>
                <p className="text-sm text-blue-700">Stock recommendations are calculated using:</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded p-3 border border-blue-200">
                <span className="font-medium text-blue-900">Current Inventory:</span>
                <span className="ml-2 text-blue-700">warehouse_stock_levels.csv</span>
              </div>
              <div className="bg-white rounded p-3 border border-blue-200">
                <span className="font-medium text-blue-900">Demand Forecasts:</span>
                <span className="ml-2 text-blue-700">lstm_forecasts_2024.json</span>
              </div>
              <div className="bg-white rounded p-3 border border-blue-200">
                <span className="font-medium text-blue-900">Lead Times:</span>
                <span className="ml-2 text-blue-700">supplier_lead_times.json</span>
              </div>
              <div className="bg-white rounded p-3 border border-blue-200">
                <span className="font-medium text-blue-900">Safety Stock Rules:</span>
                <span className="ml-2 text-blue-700">inventory_policies.json</span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-green-900">Calculation Method</p>
                <p className="text-sm text-green-700">
                  Stock levels are optimized using demand forecasting, safety stock calculations, 
                  and reorder point analysis. The system considers lead times, demand variability, 
                  and service level targets to recommend optimal inventory levels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Warehouse Coordination */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Multi-Warehouse Coordination</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-blue-900">Stock Transfer Opportunity</p>
                <p className="text-sm text-blue-700">
                  Transfer 150 units of SKU-ELEC-001 from WH004 (excess) to WH001 (urgent shortage)
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-green-900">Consolidation Opportunity</p>
                <p className="text-sm text-green-700">
                  Combine orders for SKU-HOME-002 across WH002 and WH003 for better pricing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Order Modal */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Generate Purchase Orders</h2>
              <button
                onClick={() => setShowPOModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                The following items require restocking. Review and confirm purchase orders:
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.warehouse_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sku_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.recommended_order_qty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(item.recommended_order_qty * 25).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex justify-between items-center">
                <div className="text-lg font-semibold">
                  Total: ${selectedItems.reduce((sum, item) => sum + (item.recommended_order_qty * 25), 0).toLocaleString()}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPOModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowPOModal(false);
                      // Simulate PO generation
                      alert('Purchase orders generated successfully!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generate POs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySection;