'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store';
import { getAuthToken } from '@/store/auth/slice';

interface MediaFile {
  publicId: string;
  format: string;
  bytes: number;
  sizeMB: number;
  createdAt: string;
  url: string;
}

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
  bin: {
    count: number;
    totalSize: string;
    images: MediaFile[];
    videos: MediaFile[];
  };
}

interface StorageStatsProps {
  userId: string;
}

function cloudinaryThumb(url: string): string {
  return url.replace('/upload/', '/upload/w_200,h_200,c_fill/');
}

export default function StorageStats({ userId }: StorageStatsProps) {
  const { isAuthenticated, uid, role } = useAppSelector((s) => s.auth);
  const canView = isAuthenticated && (role === 'superAdmin' || uid === userId);

  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBin, setShowBin] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!canView || !userId) return;

    async function fetchStorageStats() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/content/storageStats?userId=${userId}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
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

  const handleBinDelete = async (url: string) => {
    setDeletingUrl(url);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/content/delete-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ urls: [url] }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          bin: {
            ...prev.bin,
            count: prev.bin.count - 1,
            images: prev.bin.images.filter((f) => f.url !== url),
            videos: prev.bin.videos.filter((f) => f.url !== url),
          },
        };
      });
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeletingUrl(null);
    }
  };

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

  const binItems = [...(stats.bin?.images ?? []), ...(stats.bin?.videos ?? [])];

  return (
    <div className="flex flex-col gap-4">
      {/* Main stats card */}
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

      {/* Bin card */}
      <div className="border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Bin</h3>
            <span className="text-[10px] font-mono text-zinc-600">
              {stats.bin?.count ?? 0} unreferenced
              {stats.bin?.count > 0 && ` · ${stats.bin.totalSize}`}
            </span>
          </div>
          {(stats.bin?.count ?? 0) > 0 && (
            <button
              onClick={() => setShowBin((v) => !v)}
              className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              {showBin ? 'Hide' : 'Show'}
            </button>
          )}
        </div>

        {(stats.bin?.count ?? 0) === 0 && (
          <p className="text-zinc-700 text-xs font-mono mt-2">No unreferenced files.</p>
        )}

        {showBin && binItems.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-zinc-600 text-[10px] font-mono">
              These files are on Cloudinary but not used in any page. Delete to reclaim storage.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {binItems.map((file) => (
                <div key={file.url} className="relative group">
                  <div className="aspect-square overflow-hidden rounded border border-zinc-800">
                    {file.url.includes('/video/') ? (
                      <video src={file.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img
                        src={cloudinaryThumb(file.url)}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = file.url; }}
                      />
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className="text-[9px] font-mono text-zinc-600 truncate">
                      {(file.bytes / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    <button
                      onClick={() => handleBinDelete(file.url)}
                      disabled={deletingUrl === file.url}
                      className="text-[9px] font-mono text-red-500 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {deletingUrl === file.url ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
