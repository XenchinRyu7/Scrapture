'use client';

import { useEffect, useState } from 'react';
import NeuCard from '@/components/NeuCard';
import NeuButton from '@/components/NeuButton';
import NeuInput from '@/components/NeuInput';
import ConfirmDialog from '@/components/ConfirmDialog';

interface DomainConfig {
  id: string;
  domain: string;
  rateLimit: number;
  concurrency: number;
  delay: number;
  userAgent?: string;
  enableAI: boolean;
  aiPrompt?: string;
}

export default function ConfigsPage() {
  const [configs, setConfigs] = useState<DomainConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfigId, setDeleteConfigId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    domain: '',
    delay: 1000,
    concurrency: 1,
    rateLimit: 1000,
    userAgent: '',
    enableAI: false,
    aiPrompt: '',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/configs');
      const data = await res.json();
      setConfigs(data);
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchConfigs();
        setShowForm(false);
        setFormData({
          domain: '',
          delay: 1000,
          concurrency: 1,
          rateLimit: 1000,
          userAgent: '',
          enableAI: false,
          aiPrompt: '',
        });
      } else {
        alert('Failed to create config');
      }
    } catch (error) {
      console.error('Failed to create config:', error);
      alert('Failed to create config');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfigId) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/configs/${deleteConfigId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchConfigs();
        setDeleteConfigId(null);
      } else {
        alert('Failed to delete config');
      }
    } catch (error) {
      console.error('Failed to delete config:', error);
      alert('Failed to delete config');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Domain Configs</h1>
        <NeuButton onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Config'}
        </NeuButton>
      </div>

      {showForm && (
        <NeuCard className="p-6">
          <h2 className="text-2xl font-semibold mb-4">New Domain Config</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Domain</label>
              <NeuInput
                value={formData.domain}
                onChange={(v) => setFormData({ ...formData, domain: v })}
                placeholder="example.com"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2">Delay (ms)</label>
                <NeuInput
                  type="number"
                  value={formData.delay.toString()}
                  onChange={(v) => setFormData({ ...formData, delay: parseInt(v) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Concurrency</label>
                <NeuInput
                  type="number"
                  value={formData.concurrency.toString()}
                  onChange={(v) => setFormData({ ...formData, concurrency: parseInt(v) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Rate Limit (ms)</label>
                <NeuInput
                  type="number"
                  value={formData.rateLimit.toString()}
                  onChange={(v) => setFormData({ ...formData, rateLimit: parseInt(v) || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2">User Agent (optional)</label>
              <NeuInput
                value={formData.userAgent}
                onChange={(v) => setFormData({ ...formData, userAgent: v })}
                placeholder="Mozilla/5.0..."
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.enableAI}
                  onChange={(e) => setFormData({ ...formData, enableAI: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>Enable AI Extraction (Ollama)</span>
              </label>
            </div>
            {formData.enableAI && (
              <div>
                <label className="block text-sm mb-2">AI Prompt</label>
                <textarea
                  value={formData.aiPrompt}
                  onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                  placeholder="Extract main content from this HTML..."
                  className="neu-input w-full h-24 p-4 resize-none"
                />
              </div>
            )}
            <NeuButton onClick={handleSubmit}>
              Create Config
            </NeuButton>
          </div>
        </NeuCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {configs.map((config) => (
          <NeuCard key={config.id} className="p-6 relative group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{config.domain}</h3>
              <button
                onClick={() => setDeleteConfigId(config.id)}
                className="neu-btn p-2 text-red-500 hover:scale-110"
                title="Delete config"
              >
                🗑️
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-70">Delay:</span>
                <span>{config.delay}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Concurrency:</span>
                <span>{config.concurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Rate Limit:</span>
                <span>{config.rateLimit}ms</span>
              </div>
              {config.userAgent && (
                <div className="flex justify-between">
                  <span className="opacity-70">User Agent:</span>
                  <span className="truncate ml-2">{config.userAgent.substring(0, 30)}...</span>
                </div>
              )}
              {config.enableAI && (
                <div className="flex items-center gap-2 text-green-500">
                  <span>🤖</span>
                  <span>AI Extraction Enabled</span>
                </div>
              )}
            </div>
          </NeuCard>
        ))}
        {configs.length === 0 && (
          <NeuCard className="p-8 text-center opacity-50 col-span-full">
            No configs yet. Create one to get started!
          </NeuCard>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfigId !== null}
        title="Delete Domain Config"
        message="Are you sure you want to delete this domain configuration? Jobs using this config will still run with default settings."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfigId(null)}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        danger
      />
    </div>
  );
}
