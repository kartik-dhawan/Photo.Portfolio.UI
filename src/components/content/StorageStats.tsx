'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const [deletingAll, setDeletingAll] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);

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

  // Clear selection whenever bin is hidden
  useEffect(() => {
    if (!showBin) setSelectedUrls(new Set());
  }, [showBin]);

  const deleteFromCloudinary = async (urls: string[]) => {
    const token = getAuthToken();
    const res = await fetch('/api/content/delete-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ urls }),
    });
    if (!res.ok) throw new Error('Delete failed');
  };

  const removeBinUrls = useCallback((urls: string[]) => {
    const removed = new Set(urls);
    setStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        bin: {
          ...prev.bin,
          count: prev.bin.count - urls.length,
          images: prev.bin.images.filter((f) => !removed.has(f.url)),
          videos: prev.bin.videos.filter((f) => !removed.has(f.url)),
        },
      };
    });
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      removed.forEach((u) => next.delete(u));
      return next;
    });
  }, []);

  const handleBinDelete = async (url: string) => {
    setDeletingUrl(url);
    try {
      await deleteFromCloudinary([url]);
      removeBinUrls([url]);
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeletingUrl(null);
    }
  };

  const handleDeleteSelected = async () => {
    const urls = [...selectedUrls];
    if (!urls.length) return;
    if (!confirm(`Permanently delete ${urls.length} selected file${urls.length > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setDeletingSelected(true);
    try {
      await deleteFromCloudinary(urls);
      removeBinUrls(urls);
    } catch {
      alert('Failed to delete selected. Please try again.');
    } finally {
      setDeletingSelected(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!stats?.bin || stats.bin.count === 0) return;
    if (!confirm(`Permanently delete all ${stats.bin.count} unreferenced files? This cannot be undone.`)) return;
    setDeletingAll(true);
    try {
      const allUrls = [...stats.bin.images, ...stats.bin.videos].map((f) => f.url);
      await deleteFromCloudinary(allUrls);
      setStats((prev) => prev ? { ...prev, bin: { count: 0, totalSize: '0 B', images: [], videos: [] } } : prev);
      setSelectedUrls(new Set());
      setShowBin(false);
    } catch {
      alert('Failed to delete all. Please try again.');
    } finally {
      setDeletingAll(false);
    }
  };

  const toggleSelect = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
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
  const allSelected = binItems.length > 0 && binItems.every((f) => selectedUrls.has(f.url));
  const someSelected = selectedUrls.size > 0;
  const isBusy = deletingAll || deletingSelected || !!deletingUrl;

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
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Bin</h3>
            <span className="text-[10px] font-mono text-zinc-600">
              {stats.bin?.count ?? 0} unreferenced
              {(stats.bin?.count ?? 0) > 0 && ` · ${stats.bin.totalSize}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {(stats.bin?.count ?? 0) > 0 && (
              <button
                onClick={handleDeleteAll}
                disabled={isBusy}
                className="text-[10px] uppercase tracking-wider font-mono text-red-500 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-40"
              >
                {deletingAll ? 'Deleting…' : 'Delete All'}
              </button>
            )}
            {(stats.bin?.count ?? 0) > 0 && (
              <button
                onClick={() => setShowBin((v) => !v)}
                className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                {showBin ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
        </div>

        {(stats.bin?.count ?? 0) === 0 && (
          <p className="text-zinc-700 text-xs font-mono mt-2">No unreferenced files.</p>
        )}

        {showBin && binItems.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {/* Selection toolbar */}
            <div className="flex items-center justify-between">
              <p className="text-zinc-600 text-[10px] font-mono">
                These files are on Cloudinary but not used in any page.
              </p>
              <div className="flex items-center gap-3 shrink-0">
                {someSelected && (
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isBusy}
                    className="text-[10px] uppercase tracking-wider font-mono text-red-500 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {deletingSelected ? 'Deleting…' : `Delete (${selectedUrls.size})`}
                  </button>
                )}
                <button
                  onClick={() =>
                    allSelected
                      ? setSelectedUrls(new Set())
                      : setSelectedUrls(new Set(binItems.map((f) => f.url)))
                  }
                  disabled={isBusy}
                  className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {binItems.map((file) => {
                const selected = selectedUrls.has(file.url);
                const deleting = deletingUrl === file.url;
                return (
                  <div key={file.url} className="flex flex-col gap-1.5">
                    <div
                      onClick={() => toggleSelect(file.url)}
                      className={`relative group aspect-square overflow-hidden rounded border cursor-pointer transition-colors ${
                        selected ? 'border-white' : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
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

                      {/* Selection checkbox */}
                      <div
                        className={`absolute top-1.5 left-1.5 w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${
                          selected
                            ? 'bg-white border-white'
                            : 'bg-black/50 border-zinc-500 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {selected && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {/* Top-right delete button — only when not selected */}
                      {!selected && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBinDelete(file.url); }}
                          disabled={deleting || isBusy}
                          className="absolute top-1.5 right-1.5 bg-black/60 text-red-400 hover:bg-black/80 hover:text-red-300 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-40"
                        >
                          {deleting ? '…' : '✕'}
                        </button>
                      )}

                      {/* Selected overlay */}
                      {selected && (
                        <div className="absolute inset-0 bg-white/10 pointer-events-none" />
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-mono text-zinc-600 truncate">
                        {(file.bytes / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBinDelete(file.url); }}
                        disabled={deleting || isBusy}
                        className="text-[10px] font-mono text-red-500 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                      >
                        {deleting ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
