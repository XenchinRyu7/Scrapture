'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import NeuCard from '@/components/NeuCard';
import NeuButton from '@/components/NeuButton';
import { formatDistance } from 'date-fns';

interface Job {
  id: string;
  url: string;
  status: string;
  createdAt: string;
  sessionId?: string;
  depth?: number;
  _count?: {
    results: number;
    logs: number;
  };
}

interface Session {
  id: string;
  seedUrl: string;
  status: string;
  createdAt: string;
}

interface PaginatedResponse {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function JobsPageV2() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [response, setResponse] = useState<PaginatedResponse | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>('all');

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
    } catch {
      console.error('Failed to fetch sessions');
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      let url = `/api/jobs?page=${page}&limit=20`;
      if (filter !== 'all') url += `&status=${filter}`;
      if (selectedSession !== 'all') url += `&sessionId=${selectedSession}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      // Handle both old and new API format
      if (data.jobs) {
        setResponse(data);
      } else if (Array.isArray(data)) {
        // Old format - wrap in pagination object
        setResponse({
          jobs: data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1,
          },
        });
      }
    } catch {
      console.error('Failed to fetch jobs');
    }
  }, [page, filter, selectedSession]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'running': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      case 'queued': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const filters = ['all', 'pending', 'queued', 'running', 'completed', 'failed'];

  const jobs = response?.jobs || [];
  const pagination = response?.pagination;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Jobs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Session Filter */}
        <NeuCard className="p-4">
          <label className="text-sm opacity-70 mb-2 block">Filter by Session</label>
          <select
            value={selectedSession}
            onChange={(e) => {
              setSelectedSession(e.target.value);
              setPage(1);
            }}
            className="w-full neu-input p-3 rounded-lg"
          >
            <option value="all">All Sessions</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.seedUrl} ({session.status})
              </option>
            ))}
          </select>
        </NeuCard>

        {/* Status Filter */}
        <NeuCard className="p-4">
          <label className="text-sm opacity-70 mb-2 block">Filter by Status</label>
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`neu-btn px-3 py-2 text-sm capitalize ${
                  filter === f ? 'neu-card-inset' : ''
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </NeuCard>
      </div>

      {/* Pagination Info */}
      {pagination && (
        <div className="text-sm opacity-70 text-center">
          Showing {jobs.length} of {pagination.total} jobs
          {selectedSession !== 'all' && ' in selected session'}
          {' • '}
          Page {pagination.page} of {pagination.totalPages}
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <NeuCard className="p-6 hover:scale-[1.01] cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {job.depth !== undefined && (
                      <span className="text-xs neu-card-inset px-2 py-1 rounded">
                        Depth {job.depth}
                      </span>
                    )}
                    <div className="font-mono text-xs opacity-50">{job.id.slice(0, 8)}</div>
                  </div>
                  <div className="text-lg font-semibold mt-2 break-all">{job.url}</div>
                  <div className="flex gap-4 mt-2 text-sm opacity-70">
                    <span>
                      {formatDistance(new Date(job.createdAt), new Date(), { addSuffix: true })}
                    </span>
                    {job._count && (
                      <>
                        <span>📄 {job._count.results} results</span>
                        <span>📝 {job._count.logs} logs</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`font-semibold uppercase text-sm ${getStatusColor(job.status)}`}>
                  {job.status}
                </div>
              </div>
            </NeuCard>
          </Link>
        ))}
        {jobs.length === 0 && (
          <NeuCard className="p-8 text-center opacity-50">
            No jobs found with current filters
          </NeuCard>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <NeuButton
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Previous
          </NeuButton>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`neu-btn w-10 h-10 ${
                    page === pageNum ? 'neu-card-inset' : ''
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <NeuButton
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
          >
            Next →
          </NeuButton>
        </div>
      )}
    </div>
  );
}
