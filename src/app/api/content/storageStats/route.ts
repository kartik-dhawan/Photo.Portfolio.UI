// src/app/api/content/storageStats/route.ts
// Fetches media metadata, size, and counts per user from Cloudinary.
// Requires env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

import { NextRequest, NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CloudinaryResource {
    public_id: string;
    format: string;
    resource_type: 'image' | 'video' | 'raw';
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;       // videos only, in seconds
    created_at: string;
    secure_url: string;
    folder: string;
    tags?: string[];
}

interface CloudinaryListResponse {
    resources: CloudinaryResource[];
    next_cursor?: string;
    rate_limit_allowed: number;
    rate_limit_remaining: number;
    rate_limit_reset_at: string;
}

interface MediaFile {
    publicId: string;
    format: string;
    bytes: number;
    sizeMB: number;
    width?: number;
    height?: number;
    duration?: number;
    createdAt: string;
    url: string;
    folder: string;
    tags: string[];
}

interface CategoryStats {
    count: number;
    totalBytes: number;
    totalSizeMB: number;
    files: MediaFile[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

function toMediaFile(r: CloudinaryResource): MediaFile {
    return {
        publicId: r.public_id,
        format: r.format,
        bytes: r.bytes,
        sizeMB: round2(r.bytes / (1024 * 1024)),
        width: r.width,
        height: r.height,
        duration: r.duration,
        createdAt: r.created_at,
        url: r.secure_url,
        folder: r.folder,
        tags: r.tags ?? [],
    };
}

// ─── Cloudinary fetch (handles pagination automatically) ──────────────────────

async function fetchAllResources(
    userId: string,
    resourceType: 'image' | 'video'
): Promise<CloudinaryResource[]> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    const base64Auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const baseUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}`;

    const allResources: CloudinaryResource[] = [];
    let nextCursor: string | undefined;

    do {
        const params = new URLSearchParams({
            prefix: `photo-portfolio/${userId}`,    // folder/prefix scoped to this user
            type: 'upload',
            max_results: '500',
            metadata: 'true',
        });

        if (nextCursor) params.set('next_cursor', nextCursor);

        const res = await fetch(`${baseUrl}?${params.toString()}`, {
            headers: {
                Authorization: `Basic ${base64Auth}`,
                'Content-Type': 'application/json',
            },
            // Don't cache — always fresh
            cache: 'no-store',
        });


        if (!res.ok) {
            const text = await res.text();
            throw new Error(
                `Cloudinary API error (${resourceType}): ${res.status} ${res.statusText} — ${text}`
            );
        }

        const data: CloudinaryListResponse = await res.json();
        console.log({ data })
        allResources.push(...data.resources);
        nextCursor = data.next_cursor;
    } while (nextCursor);

    return allResources;
}

function buildCategoryStats(resources: CloudinaryResource[]): CategoryStats {
    const files = resources.map(toMediaFile);
    const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0);
    return {
        count: files.length,
        totalBytes,
        totalSizeMB: round2(totalBytes / (1024 * 1024)),
        files,
    };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // ── Auth ──────────────────────────────────────────────────────────────────
        // Replace the block below with your own auth check (e.g. verifySimpleAuth).
        // The userId must come from a trusted source (session/token), NOT the query
        // string alone — the query-string value is only used as a sanity check here.
        const userId = request.nextUrl.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // ── Env check ─────────────────────────────────────────────────────────────
        if (
            !process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            return NextResponse.json(
                { error: 'Cloudinary environment variables are not configured' },
                { status: 500 }
            );
        }

        // ── Fetch Cloudinary assets ───────────────────────────────────────────────
        const [imageResources, videoResources] = await Promise.all([
            fetchAllResources(userId, 'image'),
            fetchAllResources(userId, 'video'),
        ]);

        const images = buildCategoryStats(imageResources);
        const videos = buildCategoryStats(videoResources);

        const totalBytes = images.totalBytes + videos.totalBytes;
        const totalSizeMB = round2(totalBytes / (1024 * 1024));
        const storageLimitMB = 25 * 1024; // 25 GB — adjust as needed

        // ── Response ──────────────────────────────────────────────────────────────
        return NextResponse.json({
            userId,
            fetchedAt: new Date().toISOString(),

            // High-level summary
            summary: {
                totalFiles: images.count + videos.count,
                totalBytes,
                totalSize: formatFileSize(totalBytes),
                totalSizeMB,
                storageUsedMB: totalSizeMB,
                storageLimitMB,
                usagePercentage: round2((totalSizeMB / storageLimitMB) * 100),
            },

            // Per-type breakdown
            breakdown: {
                images: {
                    count: images.count,
                    totalBytes: images.totalBytes,
                    totalSize: formatFileSize(images.totalBytes),
                    totalSizeMB: images.totalSizeMB,
                },
                videos: {
                    count: videos.count,
                    totalBytes: videos.totalBytes,
                    totalSize: formatFileSize(videos.totalBytes),
                    totalSizeMB: videos.totalSizeMB,
                },
            },

            // Full file metadata
            files: {
                images: images.files,
                videos: videos.files,
            },
        });
    } catch (error) {
        console.error('[storageStats] Unhandled error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch storage statistics',
                detail: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}