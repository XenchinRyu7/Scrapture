'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NeuCard from '@/components/NeuCard';
import NeuButton from '@/components/NeuButton';
import ConfirmDialog from '@/components/ConfirmDialog';
import { format } from 'date-fns';

interface Job {
  id: string;
  url: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  results: Array<{
    id: string;
    htmlContent?: string;
    jsonData?: string;
    screenshotPath?: string;
    apiResponses?: string;
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
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 3000);
    return () => clearInterval(interval);
  }, [params.id]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${params.id}`);
      const data = await res.json();
      setJob(data);
    } catch (error) {
      console.error('Failed to fetch job:', error);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${params.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/jobs');
      } else {
        alert('Failed to delete job');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job');
      setDeleting(false);
    }
  };

  if (!job) {
    return <div>Loading...</div>;
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Job Details</h1>
        <NeuButton
          onClick={() => setShowDeleteDialog(true)}
          className="text-red-500"
        >
          🗑️ Delete Job
        </NeuButton>
      </div>

      <NeuCard className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm opacity-50">Job ID</div>
            <div className="font-mono">{job.id}</div>
          </div>
          <div>
            <div className="text-sm opacity-50">Status</div>
            <div className="font-semibold uppercase">{job.status}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm opacity-50">URL</div>
            <div className="break-all">{job.url}</div>
          </div>
          <div>
            <div className="text-sm opacity-50">Created</div>
            <div>{format(new Date(job.createdAt), 'PPpp')}</div>
          </div>
          <div>
            <div className="text-sm opacity-50">Updated</div>
            <div>{format(new Date(job.updatedAt), 'PPpp')}</div>
          </div>
          {job.startedAt && (
            <div>
              <div className="text-sm opacity-50">Started</div>
              <div>{format(new Date(job.startedAt), 'PPpp')}</div>
            </div>
          )}
          {job.completedAt && (
            <div>
              <div className="text-sm opacity-50">Completed</div>
              <div>{format(new Date(job.completedAt), 'PPpp')}</div>
            </div>
          )}
          {job.error && (
            <div className="col-span-2">
              <div className="text-sm opacity-50">Error</div>
              <div className="text-red-500">{job.error}</div>
            </div>
          )}
        </div>
      </NeuCard>

      {job.results.length > 0 && (
        <NeuCard className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Results</h2>
          {job.results.map((result) => {
            const jsonData = result.jsonData ? JSON.parse(result.jsonData) : null;
            const isMultiPage = jsonData?.pages && Array.isArray(jsonData.pages);
            
            return (
              <div key={result.id} className="space-y-4">
                {result.screenshotPath && (
                  <div>
                    <div className="text-sm opacity-50 mb-2">Screenshot</div>
                    <img 
                      src={`/${result.screenshotPath}`} 
                      alt="Screenshot" 
                      className="max-w-full rounded-lg"
                    />
                  </div>
                )}
                
                {jsonData && (
                  <div>
                    <div className="text-sm opacity-50 mb-2">
                      {isMultiPage ? `Extracted Data (${jsonData.totalPages} pages crawled)` : 'Extracted Data'}
                    </div>
                    
                    {isMultiPage ? (
                      <div className="space-y-4">
                        <div className="neu-card-inset p-4 text-sm">
                          <div className="font-semibold mb-2">Summary:</div>
                          <div>Total Pages: {jsonData.totalPages}</div>
                          <div className="text-xs opacity-70 mt-2">
                            URLs: {jsonData.urls?.join(', ')}
                          </div>
                        </div>
                        
                        {jsonData.pages?.map((page: any, idx: number) => (
                          <div key={idx} className="neu-card p-4">
                            <div className="font-semibold mb-2 text-blue-500">
                              Page {idx + 1}: {page.url}
                            </div>
                            {page.data && (
                              <pre className="text-xs overflow-auto max-h-48">
                                {JSON.stringify(page.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <pre className="neu-card-inset p-4 overflow-auto text-sm max-h-96">
                        {JSON.stringify(jsonData, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
                
                {result.apiResponses && (
                  <div>
                    <div className="text-sm opacity-50 mb-2">API Responses</div>
                    <pre className="neu-card-inset p-4 overflow-auto text-sm max-h-96">
                      {JSON.stringify(JSON.parse(result.apiResponses), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </NeuCard>
      )}

      <NeuCard className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Logs</h2>
        <div className="space-y-2">
          {job.logs.map((log) => (
            <div key={log.id} className="flex gap-4 text-sm font-mono">
              <div className="opacity-50">
                {format(new Date(log.timestamp), 'HH:mm:ss')}
              </div>
              <div className={`font-semibold uppercase ${getLevelColor(log.level)}`}>
                {log.level}
              </div>
              <div>{log.message}</div>
            </div>
          ))}
          {job.logs.length === 0 && (
            <div className="text-center opacity-50 py-4">No logs yet</div>
          )}
        </div>
      </NeuCard>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Job"
        message={`Are you sure you want to delete this job? This action cannot be undone. All results, logs, and screenshots for "${job.url}" will be permanently deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        danger
      />
    </div>
  );
}
