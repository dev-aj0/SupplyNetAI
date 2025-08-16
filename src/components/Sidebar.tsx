import React from 'react';
import { 
  BarChart3, 
  Package, 
  Truck, 
  AlertTriangle, 
  Upload, 
  Settings,
  TrendingUp,
  FileText
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'routes', label: 'Routes', icon: Truck },
    { id: 'anomalies', label: 'Alerts', icon: AlertTriangle },
    { id: 'upload', label: 'Data Upload', icon: Upload }
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">SupplyNet</h1>
            <p className="text-sm text-slate-400">Predictive Logistics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-400">
          <p>Version 1.0.0</p>
          <p>© 2025 Supplynet</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;