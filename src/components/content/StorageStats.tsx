'use client';

import { useEffect, useState } from 'react';

interface StorageStats {
  userId: string;
  fetchedAt: string;
  summary: {
    totalFiles: number;
    totalBytes: number;
    totalSize: string;
    totalSizeMB: number;
    storageUsedMB: number;
    storageLimitMB: number;
    usagePercentage: number;
  };
  breakdown: {
    images: {
      count: number;
      totalBytes: number;
      totalSize: string;
      totalSizeMB: number;
    };
    videos: {
      count: number;
      totalBytes: number;
      totalSize: string;
      totalSizeMB: number;
    };
  };
}

interface StorageStatsProps {
  userId: string;
}

export default function StorageStats({ userId }: StorageStatsProps) {
  console.log('StorageStats component rendering with userId:', userId);

  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('StorageStats component mounted with userId:', userId);

    async function fetchStorageStats() {
      try {
        setLoading(true);
        setError(null);

        console.log('Making API call to:', `/api/content/storageStats?userId=${userId}`);
        const response = await fetch(`/api/content/storageStats?userId=${userId}`);

        console.log('API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('API error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Storage Stats API response:', data);
        setStats(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch storage stats';
        console.error('Error fetching storage stats:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchStorageStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="border border-zinc-800 rounded-lg p-4">
        <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">
          Storage Stats
        </h3>
        <p className="text-zinc-500 text-sm">Loading storage statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-zinc-800 rounded-lg p-4">
        <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">
          Storage Stats
        </h3>
        <p className="text-red-400 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">
        Storage Stats
      </h3>

      <div className="space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-zinc-600 text-xs font-mono uppercase">Total Files</span>
            <p className="text-zinc-300 font-mono">{stats.summary.totalFiles}</p>
          </div>
          <div>
            <span className="text-zinc-600 text-xs font-mono uppercase">Total Size</span>
            <p className="text-zinc-300 font-mono">{stats.summary.totalSize}</p>
          </div>
          <div>
            <span className="text-zinc-600 text-xs font-mono uppercase">Storage Used</span>
            <p className="text-zinc-300 font-mono">{stats.summary.storageUsedMB.toFixed(2)} MB</p>
          </div>
          <div>
            <span className="text-zinc-600 text-xs font-mono uppercase">Usage</span>
            <p className="text-zinc-300 font-mono">{stats.summary.usagePercentage.toFixed(1)}%</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(stats.summary.usagePercentage, 100)}%` }}
          />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-zinc-800">
          <div>
            <span className="text-zinc-600 text-xs font-mono uppercase">Images</span>
            <p className="text-zinc-300 font-mono">{stats.breakdown.images.count} files</p>
            <p className="text-zinc-500 text-xs">{stats.breakdown.images.totalSize}</p>
          </div>
          <div>
            <span className="text-zinc-600 text-xs font-mono uppercase">Videos</span>
            <p className="text-zinc-300 font-mono">{stats.breakdown.videos.count} files</p>
            <p className="text-zinc-500 text-xs">{stats.breakdown.videos.totalSize}</p>
          </div>
        </div>

        <p className="text-zinc-600 text-xs font-mono">
          Fetched: {new Date(stats.fetchedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
