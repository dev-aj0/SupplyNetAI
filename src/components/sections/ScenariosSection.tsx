import React, { useState } from 'react';
import { Play, RotateCcw, TrendingUp, AlertTriangle, Brain, Zap } from 'lucide-react';
import ForecastChart from '../ForecastChart';
import { ForecastData } from '../../types';
import { apiService } from '../../services/api';

const ScenariosSection: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState('baseline');
  const [demandMultiplier, setDemandMultiplier] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [scenarioResults, setScenarioResults] = useState<ForecastData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scenarios = [
    { id: 'baseline', name: 'Baseline', multiplier: 1.0, description: 'Current demand patterns' },
    { id: 'spike_50', name: '50% Demand Spike', multiplier: 1.5, description: 'Sudden 50% increase in demand' },
    { id: 'drop_30', name: '30% Demand Drop', multiplier: 0.7, description: 'Economic downturn scenario' },
    { id: 'seasonal', name: 'Seasonal Peak', multiplier: 2.0, description: 'Holiday season demand' },
    { id: 'supply_chain', name: 'Supply Chain Disruption', multiplier: 0.5, description: 'Limited supply availability' },
    { id: 'custom', name: 'Custom Scenario', multiplier: demandMultiplier, description: 'User-defined parameters' }
  ];

  const runScenario = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      console.log('🚀 Running AI scenario analysis:', selectedScenario);
      
      // Call real AI backend for scenario analysis
      const response = await apiService.runScenario(selectedScenario, demandMultiplier);
      
      if (response?.data?.scenario_results) {
        console.log('✅ AI scenario results received');
        setScenarioResults(response.data.scenario_results);
      } else {
        throw new Error('No scenario results from AI backend');
      }
    } catch (error) {
      console.error('❌ Failed to run scenario:', error);
      setError('Failed to run AI scenario analysis. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const resetScenario = () => {
    setScenarioResults([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Scenario Analysis</h1>
        <p className="text-gray-600">Test different demand scenarios using AI-powered forecasting models</p>
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

      {/* Scenario Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Scenario</label>
            <div className="space-y-2">
              {scenarios.map((scenario) => (
                <label key={scenario.id} className="flex items-center">
                  <input
                    type="radio"
                    name="scenario"
                    value={scenario.id}
                    checked={selectedScenario === scenario.id}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{scenario.name}</div>
                    <div className="text-xs text-gray-500">{scenario.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Multiplier: {demandMultiplier}x
            </label>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={demandMultiplier}
              onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">Adjust demand multiplier for custom scenarios</p>
          </div>

          <div className="flex items-end space-x-3">
            <button
              onClick={runScenario}
              disabled={isRunning}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isRunning ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Running...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Run Scenario
                </>
              )}
            </button>
            <button
              onClick={resetScenario}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Results */}
      {scenarioResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              AI Scenario Results - {scenarios.find(s => s.id === selectedScenario)?.name}
            </h2>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">AI-Powered Analysis</span>
            </div>
          </div>
          
          <ForecastChart data={scenarioResults} />
        </div>
      )}

      {/* No Results State */}
      {!isRunning && scenarioResults.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Run AI Scenarios</h3>
          <p className="text-gray-600">Select a scenario and click "Run Scenario" to see AI-powered analysis</p>
        </div>
      )}
    </div>
  );
};

export default ScenariosSection;