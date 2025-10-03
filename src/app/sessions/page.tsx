'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NeuCard from '@/components/NeuCard';
import NeuButton from '@/components/NeuButton';
import NeuInput from '@/components/NeuInput';
import { formatDistance } from 'date-fns';

interface Session {
  id: string;
  seedUrl: string;
  status: string;
  maxDepth: number;
  maxPages: number;
  createdAt: string;
  _count: {
    discoveredUrls: number;
    jobs: number;
  };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    seedUrl: '',
    maxDepth: 3,
    maxPages: 100,
  });

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.seedUrl) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ seedUrl: '', maxDepth: 3, maxPages: 100 });
        setShowForm(false);
        fetchSessions();
        alert('Advanced crawl session started!');
      } else {
        alert('Failed to start session');
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'running': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      case 'queued': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Advanced Crawl Sessions</h1>
        <NeuButton onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '🕷️ New Session'}
        </NeuButton>
      </div>

      {showForm && (
        <NeuCard className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Start Advanced Crawl</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Seed URL</label>
              <NeuInput
                value={formData.seedUrl}
                onChange={(v) => setFormData({ ...formData, seedUrl: v })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Max Depth</label>
                <NeuInput
                  type="number"
                  value={formData.maxDepth.toString()}
                  onChange={(v) => setFormData({ ...formData, maxDepth: parseInt(v) || 3 })}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Max Pages</label>
                <NeuInput
                  type="number"
                  value={formData.maxPages.toString()}
                  onChange={(v) => setFormData({ ...formData, maxPages: parseInt(v) || 100 })}
                />
              </div>
            </div>
            <div className="text-xs opacity-70">
              <strong>Advanced Crawler Features:</strong>
              <ul className="list-disc list-inside mt-2">
                <li>Sitemap.xml discovery & parsing</li>
                <li>Robots.txt compliance</li>
                <li>URL normalization & deduplication</li>
                <li>Content deduplication</li>
                <li>SPA detection (pushState/replaceState)</li>
                <li>Depth-first exploration with frontier queue</li>
              </ul>
            </div>
            <NeuButton onClick={handleSubmit} disabled={loading || !formData.seedUrl}>
              {loading ? 'Starting...' : 'Start Advanced Crawl'}
            </NeuButton>
          </div>
        </NeuCard>
      )}

      <div className="space-y-4">
        {sessions.map((session) => (
          <Link key={session.id} href={`/sessions/${session.id}`}>
            <NeuCard className="p-6 hover:scale-[1.01] cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🕷️</span>
                    <div>
                      <div className="text-lg font-semibold break-all">{session.seedUrl}</div>
                      <div className="text-sm opacity-70 mt-1">
                        {formatDistance(new Date(session.createdAt), new Date(), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 text-sm">
                    <div className="neu-card-inset px-3 py-1 rounded">
                      Depth: {session.maxDepth}
                    </div>
                    <div className="neu-card-inset px-3 py-1 rounded">
                      Pages: {session.maxPages}
                    </div>
                    <div className="neu-card-inset px-3 py-1 rounded">
                      Discovered: {session._count.discoveredUrls}
                    </div>
                    <div className="neu-card-inset px-3 py-1 rounded">
                      Crawled: {session._count.jobs}
                    </div>
                  </div>
                </div>
                <div className={`font-semibold uppercase text-sm ${getStatusColor(session.status)}`}>
                  {session.status}
                </div>
              </div>
            </NeuCard>
          </Link>
        ))}
        {sessions.length === 0 && (
          <NeuCard className="p-8 text-center opacity-50">
            No sessions yet. Start an advanced crawl to explore entire websites!
          </NeuCard>
        )}
      </div>
    </div>
  );
}
