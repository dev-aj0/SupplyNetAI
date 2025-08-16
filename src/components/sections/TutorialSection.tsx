import React from 'react';

const TutorialSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SupplyNet Tutorial</h1>
        <p className="text-gray-600">Quick guide to using this MVP for development and demos.</p>
      </div>

      <ol className="list-decimal ml-6 space-y-3 text-gray-800">
        <li>
          Start the backend API at http://localhost:8001. Health checks at /api/v1/health should return healthy.
        </li>
        <li>
          Start the frontend (npm run dev) and open http://localhost:5173.
        </li>
        <li>
          Use the sidebar to navigate:
          <ul className="list-disc ml-6 mt-1 text-gray-700">
            <li>Dashboard: overview metrics and forecast chart.</li>
            <li>Forecasting: choose Warehouse and SKU to generate a forecast.</li>
            <li>Inventory: stock recommendations (read-only).</li>
            <li>Routes: route overview and map rendering.</li>
            <li>Anomalies: current anomaly overview.</li>
            <li>Reports: static summaries.</li>
            <li>Settings: tweak UI-local preferences safely.</li>
          </ul>
        </li>
        <li>
          If a call fails, the section shows a friendly message and won’t crash. Use the Retry button on error pages.
        </li>
      </ol>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-semibold">Notes</p>
        <ul className="list-disc ml-6 mt-2">
          <li>No paid APIs are required. All data comes from your local backend.</li>
          <li>Export in Forecasting downloads a CSV of the current forecast table.</li>
          <li>Map gracefully handles missing coordinates.</li>
        </ul>
      </div>
    </div>
  );
};

export default TutorialSection;


