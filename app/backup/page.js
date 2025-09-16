'use client';

import { useState, useEffect } from 'react';

export default function BackupUtility() {
  const [backupData, setBackupData] = useState('');
  const [restoreData, setRestoreData] = useState('');
  const [status, setStatus] = useState('');
  const [tradeCount, setTradeCount] = useState(0);

  useEffect(() => {
    // Check for existing trades on load
    const trades = localStorage.getItem('scannerProTrades');
    if (trades) {
      const parsedTrades = JSON.parse(trades);
      setTradeCount(parsedTrades.length);
      setStatus(`📊 Found ${parsedTrades.length} trades ready for backup`);
    }
  }, []);

  const backupTrades = () => {
    try {
      const trades = localStorage.getItem('scannerProTrades');
      const analytics = localStorage.getItem('scannerProAnalytics');
      
      if (!trades) {
        setStatus('⚠️ No trades found in localStorage');
        return;
      }
      
      const backup = {
        trades: JSON.parse(trades),
        analytics: analytics ? JSON.parse(analytics) : null,
        backupDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const backupText = JSON.stringify(backup, null, 2);
      setBackupData(backupText);
      setStatus(`✅ Successfully exported ${backup.trades.length} trades!`);
      
      // Copy to clipboard
      navigator.clipboard.writeText(backupText).then(() => {
        setStatus(`✅ Successfully exported ${backup.trades.length} trades! (Copied to clipboard)`);
      }).catch(() => {
        setStatus(`✅ Successfully exported ${backup.trades.length} trades! (Please copy manually)`);
      });
      
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };
  
  const restoreTrades = () => {
    try {
      if (!restoreData.trim()) {
        setStatus('⚠️ Please paste backup data first');
        return;
      }
      
      const backup = JSON.parse(restoreData);
      
      if (!backup.trades || !Array.isArray(backup.trades)) {
        throw new Error('Invalid backup format');
      }
      
      // Store trades
      localStorage.setItem('scannerProTrades', JSON.stringify(backup.trades));
      
      // Store analytics if available
      if (backup.analytics) {
        localStorage.setItem('scannerProAnalytics', JSON.stringify(backup.analytics));
      }
      
      setStatus(`✅ Successfully restored ${backup.trades.length} trades from ${new Date(backup.backupDate).toLocaleDateString()}!`);
      setTradeCount(backup.trades.length);
      
      // Clear restore field
      setRestoreData('');
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      setStatus(`❌ Error restoring trades: ${error.message}`);
    }
  };

  const downloadBackup = () => {
    if (!backupData) {
      setStatus('⚠️ Please export trades first');
      return;
    }

    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scanner-pro-trades-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setStatus(`✅ Backup file downloaded! Keep it safe for deployment.`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-slate-800 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-4">
            🔄 Ultimate Scanner Pro - Trade Backup Utility
          </h1>
          <p className="text-slate-300 mb-8">
            This utility helps you backup and restore your trades when deploying to production.
          </p>
          
          {/* Status Display */}
          {status && (
            <div className={`p-4 rounded-lg mb-6 ${
              status.includes('✅') ? 'bg-green-900 text-green-300' : 
              status.includes('⚠️') || status.includes('❌') ? 'bg-yellow-900 text-yellow-300' : 
              'bg-blue-900 text-blue-300'
            }`}>
              {status}
            </div>
          )}

          {/* Step 1: Backup */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-green-400 mb-4">📤 Step 1: Backup Your Current Trades</h2>
            <div className="flex gap-4 mb-4">
              <button
                onClick={backupTrades}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                📤 Export Current Trades
              </button>
              {backupData && (
                <button
                  onClick={downloadBackup}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  💾 Download Backup File
                </button>
              )}
            </div>
            
            <textarea
              value={backupData}
              readOnly
              className="w-full h-64 bg-slate-700 border border-slate-600 rounded-lg p-4 text-white font-mono text-sm"
              placeholder="Your trade backup will appear here..."
            />
            <p className="text-sm text-slate-400 mt-2">
              {tradeCount > 0 ? `Ready to backup ${tradeCount} trades` : 'No trades found to backup'}
            </p>
          </div>

          {/* Step 2: Restore */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-purple-400 mb-4">📥 Step 2: Restore Trades (After Deployment)</h2>
            <p className="text-slate-300 mb-4">
              After you deploy to production, paste your backup data below and restore:
            </p>
            
            <textarea
              value={restoreData}
              onChange={(e) => setRestoreData(e.target.value)}
              className="w-full h-48 bg-slate-700 border border-slate-600 rounded-lg p-4 text-white font-mono text-sm mb-4"
              placeholder="Paste your backup data here..."
            />
            
            <button
              onClick={restoreTrades}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              📥 Restore Trades
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4">📋 Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-300">
              <li><strong>Before Deployment:</strong> Click "Export Current Trades" and save/copy the backup data</li>
              <li><strong>Deploy Your App:</strong> Use Vercel, Netlify, or other deployment platform</li>
              <li><strong>After Deployment:</strong> Go to your new live site at /backup, paste the backup, and click "Restore Trades"</li>
            </ol>
          </div>

          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
            <p className="text-yellow-300">
              <strong>⚠️ Important:</strong> Keep this backup safe! Your trades are stored locally in your browser 
              and won't transfer automatically to the new domain.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Trading System
            </button>
            <button
              onClick={() => window.location.href = '/?tab=portfolio'}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              📊 View Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}