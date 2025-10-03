'use client';

import { useEffect, useState } from 'react';
import NeuCard from '@/components/NeuCard';
import { format } from 'date-fns';

interface Job {
  id: string;
  url: string;
  logs: Array<{
    id: string;
    level: string;
    message: string;
    timestamp: string;
  }>;
}

export default function LogsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs?limit=20&includeLogs=true');
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const allLogs = jobs.flatMap(job => 
    (job.logs || []).map(log => ({
      ...log,
      jobId: job.id,
      jobUrl: job.url,
    }))
  ).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Logs</h1>

      <NeuCard className="p-6">
        <div className="space-y-3">
          {allLogs.map((log) => (
            <div key={log.id} className="font-mono text-sm flex gap-4 items-start">
              <div className="opacity-50 whitespace-nowrap">
                {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
              </div>
              <div className={`font-semibold uppercase whitespace-nowrap ${getLevelColor(log.level)}`}>
                {log.level}
              </div>
              <div className="flex-1">
                <div className="text-xs opacity-50 mb-1">{log.jobUrl}</div>
                <div>{log.message}</div>
              </div>
            </div>
          ))}
          {allLogs.length === 0 && (
            <div className="text-center opacity-50 py-8">
              No logs yet
            </div>
          )}
        </div>
      </NeuCard>
    </div>
  );
}
