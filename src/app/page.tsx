'use client';

import { useEffect, useState } from 'react';
import NeuCard from '@/components/NeuCard';
import NeuButton from '@/components/NeuButton';
import NeuInput from '@/components/NeuInput';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  total: number;
  pending: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [maxPages, setMaxPages] = useState(10);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
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

  const handleSubmit = async () => {
    if (!url) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url,
          followLinks: maxPages > 1,
          maxPages,
          sameDomainOnly: true,
        }),
      });

      if (res.ok) {
        setUrl('');
        fetchStats();
        alert(`Job queued successfully! Will crawl up to ${maxPages} page${maxPages > 1 ? 's' : ''}.`);
      } else {
        alert('Failed to queue job');
      }
    } catch (error) {
      console.error('Failed to submit job:', error);
      alert('Failed to queue job');
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
        <h2 className="text-2xl font-semibold mb-4">New Crawl Job</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <NeuInput
                value={url}
                onChange={setUrl}
                placeholder="Enter URL to crawl..."
              />
            </div>
            <NeuButton onClick={handleSubmit} disabled={loading || !url}>
              {loading ? 'Queueing...' : 'Start Crawl'}
            </NeuButton>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm opacity-70 whitespace-nowrap">Max Pages:</label>
            <input
              type="range"
              min="1"
              max="50"
              value={maxPages}
              onChange={(e) => setMaxPages(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-mono neu-card-inset px-3 py-1 rounded-lg min-w-[3rem] text-center">
              {maxPages}
            </span>
          </div>
          <div className="text-xs opacity-50">
            {maxPages === 1 
              ? '📄 Single page crawl' 
              : `🔗 Multi-page crawl: will follow links on the same domain (up to ${maxPages} pages)`
            }
          </div>
        </div>
      </NeuCard>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <NeuCard className="p-6">
              <div className="text-sm opacity-70">Total Jobs</div>
              <div className="text-3xl font-bold mt-2">{stats.total}</div>
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
