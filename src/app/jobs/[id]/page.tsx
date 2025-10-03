'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import NeuCard from '@/components/NeuCard';
import NeuButton from '@/components/NeuButton';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { format } from 'date-fns';

interface ApiResponse {
  url: string;
  status: number;
  body?: unknown;
}

interface Job {
  id: string;
  url: string;
  status: string;
  depth?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  results: Array<{
    id: string;
    url: string;
    htmlContent?: string;
    screenshotPath?: string;
    apiResponses?: string;
    structuredData?: string;
    metadata?: string;
    extractedText?: string;
    contentHash?: string;
  }>;
  logs: Array<{
    id: string;
    level: string;
    message: string;
    timestamp: string;
  }>;
}

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'html' | 'structured' | 'metadata' | 'api' | 'screenshot' | 'logs'>('overview');
  const [showDelete, setShowDelete] = useState(false);
  const { showToast } = useToast();

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${params.id}?includeResults=true&includeLogs=true`);
      const data = await res.json();
      setJob(data);
    } catch {
      console.error('Failed to fetch job');
    }
  }, [params.id]);

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 3000);
    return () => clearInterval(interval);
  }, [fetchJob]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/jobs/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Job deleted successfully', 'success');
        window.location.href = '/jobs';
      } else {
        showToast('Failed to delete job', 'error');
      }
    } catch {
      showToast('Failed to delete job', 'error');
    }
  };

  const handleExport = async (exportFormat: 'json' | 'txt') => {
    if (!job || !job.results[0]) return;

    const result = job.results[0];
    let content = '';
    const filename = `job-${job.id}.${exportFormat}`;

    if (exportFormat === 'json') {
      const exportData = {
        job: {
          id: job.id,
          url: job.url,
          status: job.status,
          depth: job.depth,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
        },
        result: {
          url: result.url,
          structuredData: result.structuredData ? JSON.parse(result.structuredData) : null,
          metadata: result.metadata ? JSON.parse(result.metadata) : null,
          extractedText: result.extractedText,
          contentHash: result.contentHash,
          apiResponses: result.apiResponses ? JSON.parse(result.apiResponses) : null,
        },
      };
      content = JSON.stringify(exportData, null, 2);
    } else {
      // Text format
      content = `Job: ${job.url}\n`;
      content += `Status: ${job.status}\n`;
      content += `Depth: ${job.depth || 0}\n`;
      content += `Created: ${format(new Date(job.createdAt), 'PPpp')}\n`;
      content += `\n--- EXTRACTED TEXT ---\n`;
      content += result.extractedText || 'No text extracted';
      content += `\n\n--- METADATA ---\n`;
      if (result.metadata) {
        const meta = JSON.parse(result.metadata);
        Object.entries(meta).forEach(([key, value]) => {
          if (value) content += `${key}: ${value}\n`;
        });
      }
    }

    const blob = new Blob([content], { type: exportFormat === 'json' ? 'application/json' : 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showToast(`Exported as ${exportFormat.toUpperCase()}!`, 'success');
  };

  if (!job) {
    return <div>Loading...</div>;
  }

  const result = job.results[0];
  const structuredData = result?.structuredData ? JSON.parse(result.structuredData) : null;
  const metadata = result?.metadata ? JSON.parse(result.metadata) : null;
  const apiResponses = result?.apiResponses ? JSON.parse(result.apiResponses) : null;

  const tabs = [
    { key: 'overview', label: '📊 Overview', show: true },
    { key: 'html', label: '📝 HTML', show: result?.htmlContent },
    { key: 'structured', label: '🏷️ Structured Data', show: structuredData },
    { key: 'metadata', label: '📋 Metadata', show: metadata },
    { key: 'api', label: '🔌 API Responses', show: apiResponses },
    { key: 'screenshot', label: '📸 Screenshot', show: result?.screenshotPath },
    { key: 'logs', label: '📝 Logs', show: job.logs?.length > 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">Job Details</h1>
          <div className="text-sm opacity-70 break-all">{job.url}</div>
        </div>
        <div className="flex gap-2">
          <NeuButton onClick={() => handleExport('json')}>
            📄 Export JSON
          </NeuButton>
          <NeuButton onClick={() => handleExport('txt')}>
            📝 Export TXT
          </NeuButton>
          <button
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Status Card */}
      <NeuCard className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm opacity-70">Status</div>
            <div className={`text-xl font-semibold mt-1 ${
              job.status === 'completed' ? 'text-green-500' :
              job.status === 'running' ? 'text-yellow-500' :
              job.status === 'failed' ? 'text-red-500' :
              'text-blue-500'
            }`}>
              {job.status}
            </div>
          </div>
          <div>
            <div className="text-sm opacity-70">Depth</div>
            <div className="text-xl font-semibold mt-1">{job.depth || 0}</div>
          </div>
          <div>
            <div className="text-sm opacity-70">Created</div>
            <div className="text-sm mt-1">{format(new Date(job.createdAt), 'PPp')}</div>
          </div>
          {job.completedAt && (
            <div>
              <div className="text-sm opacity-70">Completed</div>
              <div className="text-sm mt-1">{format(new Date(job.completedAt), 'PPp')}</div>
            </div>
          )}
        </div>
      </NeuCard>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.filter(t => t.show).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`neu-btn px-4 py-2 whitespace-nowrap ${
              activeTab === tab.key ? 'neu-card-inset' : ''
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NeuCard className="p-6">
              <h3 className="text-xl font-semibold mb-4">📊 Statistics</h3>
              <div className="space-y-3">
                {result?.extractedText && (
                  <div className="flex justify-between">
                    <span className="opacity-70">Word Count</span>
                    <span className="font-semibold">{result.extractedText.split(/\s+/).length}</span>
                  </div>
                )}
                {structuredData && (
                  <div className="flex justify-between">
                    <span className="opacity-70">Structured Data</span>
                    <span className="font-semibold text-green-500">✓ {structuredData.length} items</span>
                  </div>
                )}
                {metadata && (
                  <div className="flex justify-between">
                    <span className="opacity-70">Metadata Fields</span>
                    <span className="font-semibold">{Object.keys(metadata).filter(k => metadata[k]).length}</span>
                  </div>
                )}
                {apiResponses && (
                  <div className="flex justify-between">
                    <span className="opacity-70">API Responses</span>
                    <span className="font-semibold">{apiResponses.length}</span>
                  </div>
                )}
                {result?.contentHash && (
                  <div className="flex justify-between">
                    <span className="opacity-70">Content Hash</span>
                    <span className="font-mono text-xs">{result.contentHash.slice(0, 16)}...</span>
                  </div>
                )}
              </div>
            </NeuCard>

            {metadata && (
              <NeuCard className="p-6">
                <h3 className="text-xl font-semibold mb-4">🏷️ Quick Metadata</h3>
                <div className="space-y-2 text-sm">
                  {metadata.canonical && (
                    <div>
                      <div className="opacity-50">Canonical URL</div>
                      <div className="break-all">{metadata.canonical}</div>
                    </div>
                  )}
                  {metadata.author && (
                    <div>
                      <div className="opacity-50">Author</div>
                      <div>{metadata.author}</div>
                    </div>
                  )}
                  {metadata.publishDate && (
                    <div>
                      <div className="opacity-50">Published</div>
                      <div>{metadata.publishDate}</div>
                    </div>
                  )}
                  {metadata.language && (
                    <div>
                      <div className="opacity-50">Language</div>
                      <div>{metadata.language}</div>
                    </div>
                  )}
                </div>
              </NeuCard>
            )}
          </div>
        )}

        {activeTab === 'html' && result?.htmlContent && (
          <NeuCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">📝 HTML Content</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.htmlContent!);
                  showToast('Copied to clipboard!', 'success');
                }}
                className="neu-btn px-3 py-1 text-sm"
              >
                📋 Copy
              </button>
            </div>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs">
              <code>{result.htmlContent}</code>
            </pre>
          </NeuCard>
        )}

        {activeTab === 'structured' && structuredData && (
          <NeuCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">🏷️ Structured Data (JSON-LD)</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(structuredData, null, 2));
                  showToast('Copied to clipboard!', 'success');
                }}
                className="neu-btn px-3 py-1 text-sm"
              >
                📋 Copy
              </button>
            </div>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs">
              <code>{JSON.stringify(structuredData, null, 2)}</code>
            </pre>
          </NeuCard>
        )}

        {activeTab === 'metadata' && metadata && (
          <NeuCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">📋 Metadata</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
                  showToast('Copied to clipboard!', 'success');
                }}
                className="neu-btn px-3 py-1 text-sm"
              >
                📋 Copy
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(metadata)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <div key={key} className="neu-card-inset p-3 rounded">
                    <div className="text-sm opacity-50 mb-1">{key}</div>
                    <div className="break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</div>
                  </div>
                ))}
            </div>
          </NeuCard>
        )}

        {activeTab === 'api' && apiResponses && (
          <NeuCard className="p-6">
            <h3 className="text-xl font-semibold mb-4">🔌 API Responses</h3>
            <div className="space-y-4">
              {apiResponses.map((resp: ApiResponse, idx: number) => (
                <div key={idx} className="neu-card-inset p-4 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-mono text-sm">{resp.url}</div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      resp.status === 200 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {resp.status}
                    </span>
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                    <code>{JSON.stringify(resp.body || {}, null, 2)}</code>
                  </pre>
                </div>
              ))}
            </div>
          </NeuCard>
        )}

        {activeTab === 'screenshot' && result?.screenshotPath && (
          <NeuCard className="p-6">
            <h3 className="text-xl font-semibold mb-4">📸 Screenshot</h3>
            <Image
              src={`/${result.screenshotPath}`}
              alt="Screenshot"
              width={800}
              height={600}
              className="w-full rounded-lg shadow-lg"
            />
          </NeuCard>
        )}

        {activeTab === 'logs' && job.logs && (
          <NeuCard className="p-6">
            <h3 className="text-xl font-semibold mb-4">📝 Logs</h3>
            <div className="space-y-2">
              {job.logs.map((log) => (
                <div key={log.id} className={`p-3 rounded text-sm ${
                  log.level === 'error' ? 'bg-red-500/10 text-red-500' :
                  log.level === 'warn' ? 'bg-yellow-500/10 text-yellow-500' :
                  'neu-card-inset'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs opacity-50">
                      {format(new Date(log.timestamp), 'HH:mm:ss')}
                    </span>
                    <span className="uppercase text-xs font-semibold">{log.level}</span>
                  </div>
                  <div className="mt-1">{log.message}</div>
                </div>
              ))}
            </div>
          </NeuCard>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Job?"
        message="This will delete the job and all associated results and logs."
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        danger
      />
    </div>
  );
}
