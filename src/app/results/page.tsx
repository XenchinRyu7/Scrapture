'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NeuCard from '@/components/NeuCard';
import NeuButton from '@/components/NeuButton';
import { formatDistance } from 'date-fns';

interface Result {
  id: string;
  url: string;
  screenshotPath?: string;
  structuredData?: string;
  metadata?: string;
  extractedText?: string;
  contentHash?: string;
  createdAt: string;
  job: {
    id: string;
    sessionId?: string;
    status: string;
  };
}

interface Session {
  id: string;
  seedUrl: string;
  status: string;
}

interface PaginatedResponse {
  results: Result[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ResultsPageNew() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [response, setResponse] = useState<PaginatedResponse | null>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
    } catch {
      console.error('Failed to fetch sessions');
    }
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      let url = `/api/results?page=${page}&limit=20`;
      if (selectedSession !== 'all') url += `&sessionId=${selectedSession}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setResponse(data);
    } catch {
      console.error('Failed to fetch results');
    }
  }, [page, selectedSession]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  const results = response?.results || [];
  const pagination = response?.pagination;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Results</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`neu-btn px-4 py-2 ${viewMode === 'grid' ? 'neu-card-inset' : ''}`}
          >
            🎞️ Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`neu-btn px-4 py-2 ${viewMode === 'list' ? 'neu-card-inset' : ''}`}
          >
            📋 List
          </button>
        </div>
      </div>

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

      {/* Pagination Info */}
      {pagination && (
        <div className="text-sm opacity-70 text-center">
          Showing {results.length} of {pagination.total} results
          {selectedSession !== 'all' && ' in selected session'}
          {' • '}
          Page {pagination.page} of {pagination.totalPages}
        </div>
      )}

      {/* Results Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <Link key={result.id} href={`/jobs/${result.job.id}`}>
              <NeuCard className="p-4 hover:scale-[1.02] cursor-pointer h-full">
                {result.screenshotPath && (
                  <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden mb-3">
                    <Image
                      src={`/${result.screenshotPath}`}
                      alt={result.url}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {!result.screenshotPath && (
                  <div className="aspect-video bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg flex items-center justify-center mb-3">
                    <div className="text-4xl">📄</div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="font-semibold text-sm truncate">{result.url}</div>
                  <div className="flex gap-2 flex-wrap text-xs">
                    {result.structuredData && (
                      <span className="neu-card-inset px-2 py-1 rounded text-green-500">
                        ✓ Structured Data
                      </span>
                    )}
                    {result.extractedText && (
                      <span className="neu-card-inset px-2 py-1 rounded text-blue-500">
                        📝 {result.extractedText.split(/\s+/).length} words
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-50">
                    {formatDistance(new Date(result.createdAt), new Date(), { addSuffix: true })}
                  </div>
                </div>
              </NeuCard>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <Link key={result.id} href={`/jobs/${result.job.id}`}>
              <NeuCard className="p-6 hover:scale-[1.01] cursor-pointer">
                <div className="flex gap-4">
                  {result.screenshotPath && (
                    <div className="w-32 h-24 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={`/${result.screenshotPath}`}
                        alt={result.url}
                        width={128}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold break-all">{result.url}</div>
                    <div className="flex gap-2 flex-wrap text-xs mt-2">
                      {result.structuredData && (
                        <span className="neu-card-inset px-2 py-1 rounded text-green-500">
                          ✓ Structured Data
                        </span>
                      )}
                      {result.metadata && (
                        <span className="neu-card-inset px-2 py-1 rounded text-purple-500">
                          🏷️ Metadata
                        </span>
                      )}
                      {result.extractedText && (
                        <span className="neu-card-inset px-2 py-1 rounded text-blue-500">
                          📝 {result.extractedText.split(/\s+/).length} words
                        </span>
                      )}
                      {result.contentHash && (
                        <span className="neu-card-inset px-2 py-1 rounded opacity-50">
                          #{result.contentHash.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs opacity-50 mt-2">
                      {formatDistance(new Date(result.createdAt), new Date(), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </NeuCard>
            </Link>
          ))}
        </div>
      )}

      {results.length === 0 && (
        <NeuCard className="p-8 text-center opacity-50">
          No results found with current filters
        </NeuCard>
      )}

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
