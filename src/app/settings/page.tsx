'use client';

import { useState } from 'react';
import NeuCard from '@/components/NeuCard';
import NeuButton from '@/components/NeuButton';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

export default function SettingsPage() {
  const [showResetDB, setShowResetDB] = useState(false);
  const [showClearCache, setShowClearCache] = useState(false);
  const [showClearScreenshots, setShowClearScreenshots] = useState(false);
  const { showToast } = useToast();

    const handleResetDatabase = async () => {
    try {
      const res = await fetch('/api/settings/reset-database', {
        method: 'POST',
      });

      if (res.ok) {
        const result = await res.json();
        showToast(`✅ Database reset successful! Deleted: ${result.deleted.sessions} sessions, ${result.deleted.jobs} jobs, ${result.deleted.results} results`, 'success');
        setShowResetDB(false);
      } else {
        showToast('❌ Failed to reset database', 'error');
      }
    } catch {
      showToast('❌ Failed to reset database', 'error');
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await fetch('/api/settings/clear-cache', {
        method: 'POST',
      });

      if (res.ok) {
        showToast('🧹 Cache cleared successfully!', 'success');
        setShowClearCache(false);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to clear cache', 'error');
      }
    } catch {
      showToast('Failed to clear cache', 'error');
    }
  };

  const handleClearScreenshots = async () => {
    try {
      const res = await fetch('/api/settings/clear-screenshots', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`🖼️ Cleared ${data.count} screenshots!`, 'success');
        setShowClearScreenshots(false);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to clear screenshots', 'error');
      }
    } catch {
      showToast('Failed to clear screenshots', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">⚙️ Settings</h1>

      {/* System Info */}
      <NeuCard className="p-6">
        <h2 className="text-2xl font-semibold mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="neu-card-inset p-4 rounded">
            <div className="text-sm opacity-70">Version</div>
            <div className="text-xl font-semibold mt-1">2.0.0-beta</div>
          </div>
          <div className="neu-card-inset p-4 rounded">
            <div className="text-sm opacity-70">Environment</div>
            <div className="text-xl font-semibold mt-1">
              {process.env.NODE_ENV || 'development'}
            </div>
          </div>
          <div className="neu-card-inset p-4 rounded">
            <div className="text-sm opacity-70">Database</div>
            <div className="text-xl font-semibold mt-1">SQLite</div>
          </div>
          <div className="neu-card-inset p-4 rounded">
            <div className="text-sm opacity-70">Cache</div>
            <div className="text-xl font-semibold mt-1">Redis</div>
          </div>
        </div>
      </NeuCard>

      {/* Maintenance */}
      <NeuCard className="p-6">
        <h2 className="text-2xl font-semibold mb-4">🧹 Maintenance</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">Clear Redis Cache</div>
              <div className="text-sm opacity-70 mt-1">
                Clear all queued jobs and cache data from Redis
              </div>
            </div>
            <NeuButton onClick={() => setShowClearCache(true)}>
              Clear Cache
            </NeuButton>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">Clear Screenshots</div>
              <div className="text-sm opacity-70 mt-1">
                Delete all screenshot files from public/screenshots folder
              </div>
            </div>
            <NeuButton onClick={() => setShowClearScreenshots(true)}>
              Clear Screenshots
            </NeuButton>
          </div>
        </div>
      </NeuCard>

      {/* Danger Zone */}
      <NeuCard className="p-6 border-2 border-red-500/20">
        <h2 className="text-2xl font-semibold mb-2 text-red-500">⚠️ Danger Zone</h2>
        <p className="text-sm opacity-70 mb-6">
          These actions are irreversible. Use with caution!
        </p>

        <div className="space-y-4">
          <div className="flex justify-between items-center bg-red-500/5 p-4 rounded-lg">
            <div>
              <div className="font-semibold text-red-500">Reset Database</div>
              <div className="text-sm opacity-70 mt-1">
                Delete ALL crawl sessions, jobs, results, logs, and configurations. This cannot be undone!
              </div>
            </div>
            <button
              onClick={() => setShowResetDB(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold"
            >
              🗑️ Reset DB
            </button>
          </div>
        </div>
      </NeuCard>

      {/* Environment Variables */}
      <NeuCard className="p-6">
        <h2 className="text-2xl font-semibold mb-4">🔐 Environment</h2>
        <div className="space-y-2 text-sm font-mono">
          <div className="neu-card-inset p-3 rounded">
            <span className="opacity-70">DATABASE_URL:</span>{' '}
            <span className="text-green-500">✓ Configured</span>
          </div>
          <div className="neu-card-inset p-3 rounded">
            <span className="opacity-70">REDIS_URL:</span>{' '}
            <span className="text-green-500">✓ Configured</span>
          </div>
          <div className="neu-card-inset p-3 rounded">
            <span className="opacity-70">OLLAMA_API_URL:</span>{' '}
            <span className="text-yellow-500">○ Optional</span>
          </div>
        </div>
      </NeuCard>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showResetDB}
        title="Reset Database?"
        message="This will DELETE ALL data including sessions, jobs, results, logs, and configs. This action CANNOT be undone!"
        onConfirm={handleResetDatabase}
        onCancel={() => setShowResetDB(false)}
        confirmText="Yes, Reset Database"
        cancelText="Cancel"
        danger
      />

      <ConfirmDialog
        isOpen={showClearCache}
        title="Clear Redis Cache?"
        message="This will clear all queued jobs and cache data from Redis. Active jobs will be lost."
        onConfirm={handleClearCache}
        onCancel={() => setShowClearCache(false)}
        confirmText="Yes, Clear Cache"
        cancelText="Cancel"
      />

      <ConfirmDialog
        isOpen={showClearScreenshots}
        title="Clear Screenshots?"
        message="This will delete all screenshot files from the public/screenshots folder. Database records will remain."
        onConfirm={handleClearScreenshots}
        onCancel={() => setShowClearScreenshots(false)}
        confirmText="Yes, Clear Screenshots"
        cancelText="Cancel"
      />
    </div>
  );
}
