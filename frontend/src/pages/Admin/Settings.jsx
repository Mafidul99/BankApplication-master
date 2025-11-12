import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function Settings() {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    // Admin-specific settings
    autoApproveLoans: false,
    maxLoanAmount: 50000,
    interestRateRange: { min: 1, max: 15 },
    notificationLevel: 'medium',
    backupFrequency: 'daily'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    // Implement admin settings save logic
    console.log('Saving admin settings:', settings);
    alert('Admin settings saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-1">System configuration and administrative preferences</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Loan Management Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Management</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Auto-approve Loans</label>
                  <p className="text-sm text-gray-500">Automatically approve loans meeting criteria</p>
                </div>
                <button
                  onClick={() => handleSettingChange('autoApproveLoans', !settings.autoApproveLoans)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.autoApproveLoans ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.autoApproveLoans ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Loan Amount: ${settings.maxLoanAmount.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={settings.maxLoanAmount}
                  onChange={(e) => handleSettingChange('maxLoanAmount', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$1,000</span>
                  <span>$100,000</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Interest Rate (%)</label>
                  <input
                    type="number"
                    value={settings.interestRateRange.min}
                    onChange={(e) => handleSettingChange('interestRateRange', {
                      ...settings.interestRateRange,
                      min: parseFloat(e.target.value)
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min="0.1"
                    max="50"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Interest Rate (%)</label>
                  <input
                    type="number"
                    value={settings.interestRateRange.max}
                    onChange={(e) => handleSettingChange('interestRateRange', {
                      ...settings.interestRateRange,
                      max: parseFloat(e.target.value)
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min="0.1"
                    max="50"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Notification Level</label>
                <select
                  value={settings.notificationLevel}
                  onChange={(e) => handleSettingChange('notificationLevel', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Save Admin Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;