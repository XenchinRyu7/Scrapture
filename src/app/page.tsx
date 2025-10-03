'use client';

import { useEffect, useState } from 'react';
import NeuCard from '@/components/NeuCard';
import NeuButton from '@/components/NeuButton';
import NeuInput from '@/components/NeuInput';
import { useToast } from '@/components/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  total: number;
  pending: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
}

interface SessionStats {
  total: number;
  running: number;
  completed: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [seedUrl, setSeedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [maxDepth, setMaxDepth] = useState(3);
  const [maxPages, setMaxPages] = useState(100);
  const { showToast } = useToast();

  useEffect(() => {
    fetchStats();
    fetchSessionStats();
    const interval = setInterval(() => {
      fetchStats();
      fetchSessionStats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchSessionStats = async () => {
    try {
      const res = await fetch('/api/sessions/stats');
      const data = await res.json();
      setSessionStats(data);
    } catch (error) {
      console.error('Failed to fetch session stats:', error);
    }
  };

  const handleSubmit = async () => {
    if (!seedUrl) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          seedUrl,
          maxDepth,
          maxPages,
          sameDomainOnly: true,
          followSitemap: true,
          respectRobots: true,
        }),
      });

      if (res.ok) {
        await res.json();
        setSeedUrl('');
        fetchStats();
        fetchSessionStats();
        showToast(`🕷️ Advanced crawl session started! Max depth: ${maxDepth}, Max pages: ${maxPages}`, 'success');
      } else {
        showToast('Failed to start crawl session', 'error');
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      showToast('Failed to start crawl session', 'error');
    } finally {
      setLoading(false);
    }
  };

  const chartData = stats ? [
    { name: 'Pending', value: stats.pending },
    { name: 'Queued', value: stats.queued },
    { name: 'Running', value: stats.running },
    { name: 'Completed', value: stats.completed },
    { name: 'Failed', value: stats.failed },
  ] : [];

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>

      <NeuCard className="p-8">
        <h2 className="text-2xl font-semibold mb-4">🕷️ Quick Session Start</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <NeuInput
                value={seedUrl}
                onChange={setSeedUrl}
                placeholder="Enter seed URL (e.g., https://example.com)..."
              />
            </div>
            <NeuButton onClick={handleSubmit} disabled={loading || !seedUrl}>
              {loading ? 'Starting...' : 'Start Advanced Crawl'}
            </NeuButton>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-4">
                <label className="text-sm opacity-70 whitespace-nowrap">Max Depth:</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono neu-card-inset px-3 py-1 rounded-lg min-w-[3rem] text-center">
                  {maxDepth}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4">
                <label className="text-sm opacity-70 whitespace-nowrap">Max Pages:</label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono neu-card-inset px-3 py-1 rounded-lg min-w-[3rem] text-center">
                  {maxPages}
                </span>
              </div>
            </div>
          </div>
          <div className="text-xs opacity-70 neu-card-inset p-3 rounded">
            <strong>🚀 Advanced Crawler:</strong> Automatically discovers URLs via sitemap.xml, respects robots.txt, normalizes URLs, deduplicates content, and extracts structured data.
          </div>
        </div>
      </NeuCard>

      {stats && sessionStats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <NeuCard className="p-6">
              <div className="text-4xl mb-2">🕷️</div>
              <div className="text-3xl font-bold">{sessionStats.total}</div>
              <div className="text-sm opacity-70">Sessions</div>
            </NeuCard>
            <NeuCard className="p-6">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm opacity-70">Pages</div>
            </NeuCard>
            <NeuCard className="p-6">
              <div className="text-sm opacity-70">Pending</div>
              <div className="text-3xl font-bold mt-2 text-gray-500">{stats.pending}</div>
            </NeuCard>
            <NeuCard className="p-6">
              <div className="text-sm opacity-70">Queued</div>
              <div className="text-3xl font-bold mt-2 text-blue-500">{stats.queued}</div>
            </NeuCard>
            <NeuCard className="p-6">
              <div className="text-sm opacity-70">Running</div>
              <div className="text-3xl font-bold mt-2 text-yellow-500">{stats.running}</div>
            </NeuCard>
            <NeuCard className="p-6">
              <div className="text-sm opacity-70">Completed</div>
              <div className="text-3xl font-bold mt-2 text-green-500">{stats.completed}</div>
            </NeuCard>
            <NeuCard className="p-6">
              <div className="text-sm opacity-70">Failed</div>
              <div className="text-3xl font-bold mt-2 text-red-500">{stats.failed}</div>
            </NeuCard>
          </div>

          <NeuCard className="p-8">
            <h2 className="text-2xl font-semibold mb-6">Job Statistics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
        </>
      )}
    </div>
  );
}
