'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import NeuCard from '@/components/NeuCard';
import NeuButton from '@/components/NeuButton';
import { useToast } from '@/components/Toast';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Session {
  id: string;
  seedUrl: string;
  status: string;
  maxDepth: number;
  maxPages: number;
  createdAt: string;
  discoveredUrls: Array<{
    id: string;
    url: string;
    normalizedUrl: string;
    status: string;
    depth: number;
    parentUrl?: string;
  }>;
  jobs: Array<{
    id: string;
    url: string;
    status: string;
    results: Array<{
      structuredData?: string;
      metadata?: string;
      extractedText?: string;
    }>;
  }>;
  stats: {
    byStatus: Record<string, number>;
    byDepth: Record<number, number>;
  };
  overallStats?: {
    totalJobs: number;
    completedJobs: number;
    totalStructuredData: number;
    totalWords: number;
    totalMetadata: number;
  };
}

export default function SessionDetailPage() {
  const params = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const { showToast } = useToast();

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${params.id}`);
      const data = await res.json();
      setSession(data);
    } catch {
      console.error('Failed to fetch session');
    }
  }, [params.id]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const handleExport = async (format: 'json' | 'csv' | 'ndjson') => {
    try {
      const response = await fetch(`/api/sessions/${params.id}/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${params.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast(`Exported as ${format.toUpperCase()}!`, 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  const statusChartData = Object.entries(session.stats.byStatus || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const depthChartData = Object.entries(session.stats.byDepth || {}).map(([depth, count]) => ({
    name: `Depth ${depth}`,
    value: count,
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">🕷️ Session Details</h1>
        <div className="flex gap-2">
          <NeuButton onClick={() => handleExport('json')}>
            📄 Export JSON
          </NeuButton>
          <NeuButton onClick={() => handleExport('csv')}>
            📊 Export CSV
          </NeuButton>
          <NeuButton onClick={() => handleExport('ndjson')}>
            📋 Export NDJSON
          </NeuButton>
        </div>
      </div>

      <NeuCard className="p-6">
        <div className="space-y-4">
          <div>
            <div className="text-sm opacity-50">Seed URL</div>
            <div className="text-xl font-semibold break-all">{session.seedUrl}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm opacity-50">Status</div>
              <div className="font-semibold uppercase">{session.status}</div>
            </div>
            <div>
              <div className="text-sm opacity-50">Max Depth</div>
              <div>{session.maxDepth}</div>
            </div>
            <div>
              <div className="text-sm opacity-50">Max Pages</div>
              <div>{session.maxPages}</div>
            </div>
            <div>
              <div className="text-sm opacity-50">Created</div>
              <div>{format(new Date(session.createdAt), 'PPpp')}</div>
            </div>
          </div>
        </div>
      </NeuCard>

      {/* Overall Statistics */}
      {session.overallStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <NeuCard className="p-4">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-bold">{session.overallStats.totalJobs}</div>
            <div className="text-sm opacity-70">Total Jobs</div>
          </NeuCard>
          <NeuCard className="p-4">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-500">{session.overallStats.completedJobs}</div>
            <div className="text-sm opacity-70">Completed</div>
          </NeuCard>
          <NeuCard className="p-4">
            <div className="text-3xl mb-2">🏷️</div>
            <div className="text-2xl font-bold text-purple-500">{session.overallStats.totalStructuredData}</div>
            <div className="text-sm opacity-70">Structured Data</div>
          </NeuCard>
          <NeuCard className="p-4">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-2xl font-bold text-blue-500">{session.overallStats.totalWords.toLocaleString()}</div>
            <div className="text-sm opacity-70">Total Words</div>
          </NeuCard>
          <NeuCard className="p-4">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-bold text-yellow-500">{session.overallStats.totalMetadata}</div>
            <div className="text-sm opacity-70">Metadata Items</div>
          </NeuCard>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NeuCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">URLs by Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--background)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)'
                }} 
              />
              <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </NeuCard>

        <NeuCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">URLs by Depth</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={depthChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--background)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)'
                }} 
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </NeuCard>
      </div>

      <NeuCard className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Discovered URLs</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {session.discoveredUrls.map((url) => (
            <div key={url.id} className="flex gap-4 items-center text-sm p-3 neu-card-inset rounded">
              <div className={`font-semibold uppercase text-xs w-20 ${
                url.status === 'completed' ? 'text-green-500' :
                url.status === 'running' ? 'text-yellow-500' :
                url.status === 'failed' ? 'text-red-500' :
                'text-blue-500'
              }`}>
                {url.status}
              </div>
              <div className="text-xs opacity-50 w-16">
                Depth {url.depth}
              </div>
              <div className="flex-1 break-all">
                {url.url}
              </div>
            </div>
          ))}
          {session.discoveredUrls.length === 0 && (
            <div className="text-center opacity-50 py-4">No URLs discovered yet</div>
          )}
        </div>
      </NeuCard>

      <NeuCard className="p-6">
        <h2 className="text-2xl font-semibold mb-4">📊 Extracted Data Preview</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {session.jobs.filter(j => j.status === 'completed' && j.results.length > 0).slice(0, 5).map((job) => {
            const result = job.results[0];
            const structured = result.structuredData ? JSON.parse(result.structuredData) : null;
            const metadata = result.metadata ? JSON.parse(result.metadata) : null;
            
            return (
              <div key={job.id} className="neu-card-inset p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <a href={`/jobs/${job.id}`} className="text-sm font-semibold text-blue-500 hover:underline break-all flex-1">
                    {job.url}
                  </a>
                </div>
                
                {/* Structured Data Preview */}
                {structured && structured.length > 0 && (
                  <div className="mt-2 text-sm">
                    <div className="font-semibold opacity-70">🏷️ Structured Data:</div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded mt-1 text-xs">
                      {structured[0]['@type'] && (
                        <div><strong>Type:</strong> {structured[0]['@type']}</div>
                      )}
                      {structured[0].name && (
                        <div><strong>Name:</strong> {structured[0].name}</div>
                      )}
                      {structured[0].headline && (
                        <div><strong>Headline:</strong> {structured[0].headline}</div>
                      )}
                      {structured[0].description && (
                        <div className="opacity-70 truncate"><strong>Description:</strong> {structured[0].description}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Metadata Preview */}
                {metadata && (
                  <div className="mt-2 text-sm">
                    <div className="font-semibold opacity-70">📋 Metadata:</div>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                      {metadata.canonical && (
                        <div className="truncate"><strong>Canonical:</strong> {metadata.canonical.slice(0, 40)}...</div>
                      )}
                      {metadata.author && (
                        <div><strong>Author:</strong> {metadata.author}</div>
                      )}
                      {metadata.ogType && (
                        <div><strong>Type:</strong> {metadata.ogType}</div>
                      )}
                      {metadata.language && (
                        <div><strong>Language:</strong> {metadata.language}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Extracted Text Preview */}
                {result.extractedText && (
                  <div className="mt-2 text-sm">
                    <div className="font-semibold opacity-70">📝 Text Preview:</div>
                    <div className="text-xs opacity-70 mt-1">
                      {result.extractedText.substring(0, 200)}...
                      <span className="text-blue-500 ml-2">
                        ({result.extractedText.split(/\s+/).length} words)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {session.jobs.filter(j => j.status === 'completed' && j.results.length > 0).length === 0 && (
            <div className="text-center opacity-50 py-8">No extracted data yet</div>
          )}
        </div>
      </NeuCard>

      <NeuCard className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Crawled Jobs ({session.jobs.length})</h2>
        <div className="space-y-2">
          {session.jobs.map((job) => (
            <a
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block p-3 neu-card-inset rounded hover:scale-[1.01] transition-all"
            >
              <div className="flex justify-between items-center">
                <div className="break-all">{job.url}</div>
                <div className="flex gap-2 items-center">
                  {job.results && job.results.length > 0 && job.results[0].structuredData && (
                    <span className="text-xs neu-card-inset px-2 py-1 rounded text-green-500">
                      ✓ Data
                    </span>
                  )}
                  <div className={`font-semibold uppercase text-xs ${
                    job.status === 'completed' ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {job.status}
                  </div>
                </div>
              </div>
            </a>
          ))}
          {session.jobs.length === 0 && (
            <div className="text-center opacity-50 py-4">No jobs crawled yet</div>
          )}
        </div>
      </NeuCard>
    </div>
  );
}
