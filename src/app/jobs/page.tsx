'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NeuCard from '@/components/NeuCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDistance } from 'date-fns';

interface Job {
  id: string;
  url: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchJobs = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/jobs' 
        : `/api/jobs?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
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

  const handleDelete = async () => {
    if (!deleteJobId) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${deleteJobId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchJobs();
        setDeleteJobId(null);
      } else {
        alert('Failed to delete job');
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const res = await fetch('/api/jobs/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: filter }),
      });

      if (res.ok) {
        const data = await res.json();
        fetchJobs();
        setShowBulkDelete(false);
        alert(data.message);
      } else {
        alert('Failed to bulk delete jobs');
      }
    } catch (error) {
      console.error('Failed to bulk delete jobs:', error);
      alert('Failed to bulk delete jobs');
    } finally {
      setBulkDeleting(false);
    }
  };

  const filters = ['all', 'pending', 'queued', 'running', 'completed', 'failed'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Jobs</h1>
        {filter !== 'all' && jobs.length > 0 && (
          <button
            onClick={() => setShowBulkDelete(true)}
            className="neu-btn px-4 py-2 text-red-500"
          >
            🗑️ Delete All {filter}
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`neu-btn px-4 py-2 capitalize ${
              filter === f ? 'neu-card-inset' : ''
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <NeuCard key={job.id} className="p-6 hover:scale-[1.01] relative group">
            <Link href={`/jobs/${job.id}`} className="block">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-mono text-sm opacity-50">{job.id}</div>
                  <div className="text-lg font-semibold mt-1 break-all">{job.url}</div>
                  <div className="text-sm mt-2 opacity-70">
                    {formatDistance(new Date(job.createdAt), new Date(), { addSuffix: true })}
                  </div>
                  {job.error && (
                    <div className="text-sm text-red-500 mt-2">{job.error}</div>
                  )}
                </div>
                <div className={`font-semibold uppercase text-sm ${getStatusColor(job.status)}`}>
                  {job.status}
                </div>
              </div>
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteJobId(job.id);
              }}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity neu-btn p-2 text-red-500 hover:scale-110"
              title="Delete job"
            >
              🗑️
            </button>
          </NeuCard>
        ))}
        {jobs.length === 0 && (
          <NeuCard className="p-8 text-center opacity-50">
            No jobs found
          </NeuCard>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteJobId !== null}
        title="Delete Job"
        message="Are you sure you want to delete this job? This action cannot be undone. All results and logs will be permanently deleted."
        onConfirm={handleDelete}
        onCancel={() => setDeleteJobId(null)}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        danger
      />

      <ConfirmDialog
        isOpen={showBulkDelete}
        title={`Delete All ${filter} Jobs`}
        message={`Are you sure you want to delete ALL ${filter} jobs (${jobs.length} job${jobs.length !== 1 ? 's' : ''})? This action cannot be undone. All results, logs, and screenshots will be permanently deleted.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDelete(false)}
        confirmText={bulkDeleting ? 'Deleting...' : 'Delete All'}
        cancelText="Cancel"
        danger
      />
    </div>
  );
}
