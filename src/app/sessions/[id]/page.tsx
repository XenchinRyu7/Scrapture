'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import NeuCard from '@/components/NeuCard';
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
  }>;
  stats: {
    byStatus: Record<string, number>;
    byDepth: Record<number, number>;
  };
}

export default function SessionDetailPage() {
  const params = useParams();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [params.id]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${params.id}`);
      const data = await res.json();
      setSession(data);
    } catch (error) {
      console.error('Failed to fetch session:', error);
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
      <h1 className="text-4xl font-bold">🕷️ Session Details</h1>

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
        <h2 className="text-2xl font-semibold mb-4">Crawled Jobs</h2>
        <div className="space-y-2">
          {session.jobs.map((job) => (
            <a
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block p-3 neu-card-inset rounded hover:scale-[1.01] transition-all"
            >
              <div className="flex justify-between items-center">
                <div className="break-all">{job.url}</div>
                <div className={`font-semibold uppercase text-xs ${
                  job.status === 'completed' ? 'text-green-500' : 'text-gray-500'
                }`}>
                  {job.status}
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
