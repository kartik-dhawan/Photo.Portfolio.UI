'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store';

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
    images: { count: number; totalBytes: number; totalSize: string; totalSizeMB: number };
    videos: { count: number; totalBytes: number; totalSize: string; totalSizeMB: number };
  };
}

interface StorageStatsProps {
  userId: string;
}

export default function StorageStats({ userId }: StorageStatsProps) {
  const { isAuthenticated, uid, role } = useAppSelector((s) => s.auth);
  const canView = isAuthenticated && (role === 'superAdmin' || uid === userId);

  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canView || !userId) return;

    async function fetchStorageStats() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/content/storageStats?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setStats(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch storage stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStorageStats();
  }, [userId, canView]);

  if (!canView) return null;

  if (loading) {
    return (
      <div className="border border-zinc-800 rounded-lg p-4">
        <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">Storage Stats</h3>
        <p className="text-zinc-500 text-sm">Loading storage statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-zinc-800 rounded-lg p-4">
        <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">Storage Stats</h3>
        <p className="text-red-400 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">Storage Stats</h3>
      <div className="space-y-3">
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

        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(stats.summary.usagePercentage, 100)}%` }}
          />
        </div>

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
