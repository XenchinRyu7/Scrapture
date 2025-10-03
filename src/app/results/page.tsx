'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NeuCard from '@/components/NeuCard';
import { formatDistance } from 'date-fns';

interface Job {
  id: string;
  url: string;
  status: string;
  createdAt: string;
  results: Array<{
    id: string;
    screenshotPath?: string;
    jsonData?: string;
  }>;
}

export default function ResultsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs?status=completed&includeResults=true');
      const data = await res.json();
      setJobs(data.filter((job: Job) => job.results && job.results.length > 0));
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Results</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <NeuCard className="p-6 hover:scale-[1.02] cursor-pointer h-full">
              {job.results[0]?.screenshotPath && (
                <div className="mb-4">
                  <img 
                    src={`/${job.results[0].screenshotPath}`} 
                    alt="Screenshot"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="text-sm font-semibold truncate">{job.url}</div>
              <div className="text-xs opacity-50 mt-2">
                {formatDistance(new Date(job.createdAt), new Date(), { addSuffix: true })}
              </div>
              {job.results[0]?.jsonData && (
                <div className="mt-2 text-xs">
                  <span className="neu-card-inset px-2 py-1 rounded">
                    📊 Has extracted data
                  </span>
                </div>
              )}
            </NeuCard>
          </Link>
        ))}
        {jobs.length === 0 && (
          <NeuCard className="p-8 text-center opacity-50 col-span-full">
            No results yet
          </NeuCard>
        )}
      </div>
    </div>
  );
}
