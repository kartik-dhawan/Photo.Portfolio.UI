'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  fetchPageContent,
  savePageContent,
  uploadMedia,
  deleteMedia,
  setDraft,
  clearDraft,
  addBlock,
  updateBlock,
  removeBlock,
  reorderBlocks,
  updateSettings,
  ContentBlock,
  BlockType,
  Brand,
} from '@/store/content';
import { updateNavItem } from '@/store/nav';
import { useModal } from '@/components/common/useModal';
import BrandAvatar from '@/components/common/BrandAvatar';
import BlockRenderer from './BlockRenderer';
import RichTextEditor from './RichTextEditor';
import ImageBlockEditor from './ImageBlockEditor';
import YouTubeBlockEditor from './YouTubeBlockEditor';
import BlockWrapper from './BlockWrapper';
import AddBlockButton from './AddBlockButton';
import ProjectSettingsForm from '@/components/forms/project-settings/ProjectSettingsForm';
import { ProjectSettingsFormValues } from '@/components/forms/project-settings/schema';
import Skeleton from '@/components/common/Skeleton';
import FloatingPaths from '@/components/home/FloatingPaths';
import { PageContent as PageContentType } from '@/store/content/types';

interface Props {
  slug: string;
  initialContent: PageContentType | null;
  initialLabel: string;
  initialRouteId: string;
}

export default function PageContent({
  slug,
  initialContent,
  initialLabel,
  initialRouteId,
}: Props) {
  const dispatch = useAppDispatch();
  const { isAdmin } = useAppSelector((s) => s.auth);
  const { items: navItems } = useAppSelector((s) => s.nav);
  const { pages, drafts, loading, saving, error } = useAppSelector(
    (s) => s.content
  );

  // Use redux state if available (after admin edits), otherwise use server-fetched data
  const page = pages[slug];
  const navItem = navItems.find((item) => item.route === `/${slug}`);
  const pageLabel = navItem?.label ?? initialLabel;
  const routeId = navItem?.id ?? initialRouteId;

  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settingsModal, renderSettingsModal] = useModal({
    title: 'Project Settings',
  });
  const [settingsState, setSettingsState] = useState<{
    hasChanges: boolean;
    saving: boolean;
    save: () => Promise<void>;
  }>({ hasChanges: false, saving: false, save: async () => {} });

  // Map blob URLs to their File objects for deferred upload
  const pendingFiles = useRef<Map<string, File>>(new Map());
  // Track blob URLs that were removed so we don't upload them
  const removedBlobs = useRef<Set<string>>(new Set());
  // Track remote URLs that were removed so we delete them on save
  const removedRemoteUrls = useRef<string[]>([]);

  // Hydrate redux from server data on first load; fetch fresh data when admin
  const hydrated = useRef(false);
  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchPageContent(slug));
    } else if (!hydrated.current && initialContent) {
      // For non-admin, no need to re-fetch — server data is fresh
      hydrated.current = true;
    }
  }, [dispatch, slug, isAdmin, initialContent]);

  const effectivePage = page ?? initialContent;
  const draftBlockList = drafts[slug];
  const blocks =
    editing && draftBlockList ? draftBlockList : effectivePage?.blocks ?? [];
  const brands = effectivePage?.brands ?? [];
  const tags = effectivePage?.tags ?? [];
  const filmedAt = effectivePage?.filmedAt ?? '';

  const handleEdit = () => {
    dispatch(setDraft({ slug, blocks: page?.blocks ?? [] }));
    pendingFiles.current.clear();
    removedBlobs.current.clear();
    removedRemoteUrls.current = [];
    setEditing(true);
  };

  const handleCancel = () => {
    pendingFiles.current.forEach((_, blobUrl) => URL.revokeObjectURL(blobUrl));
    pendingFiles.current.clear();
    removedBlobs.current.clear();
    removedRemoteUrls.current = [];
    dispatch(clearDraft(slug));
    setEditing(false);
  };

  const handleSave = async () => {
    if (!draftBlockList || isSaving) return;
    setIsSaving(true);

    if (removedRemoteUrls.current.length) {
      await dispatch(deleteMedia(removedRemoteUrls.current));
    }

    const blobToRemote = new Map<string, string>();
    const uploads = Array.from(pendingFiles.current.entries())
      .filter(([blobUrl]) => !removedBlobs.current.has(blobUrl))
      .map(async ([blobUrl, file]) => {
        const result = await dispatch(uploadMedia({ slug, file })).unwrap();
        blobToRemote.set(blobUrl, result.url);
        URL.revokeObjectURL(blobUrl);
      });

    await Promise.all(uploads);

    const finalBlocks = draftBlockList.map((block) => {
      if (block.type !== 'image' || !block.media?.length) return block;
      return {
        ...block,
        media: block.media.map((m) => ({
          ...m,
          url: blobToRemote.get(m.url) ?? m.url,
        })),
      };
    });

    await dispatch(
      savePageContent({
        slug,
        blocks: finalBlocks,
        brands,
      })
    );
    pendingFiles.current.clear();
    removedBlobs.current.clear();
    removedRemoteUrls.current = [];
    setIsSaving(false);
    setEditing(false);
  };

  const handleFileAdd = useCallback((blobUrl: string, file: File) => {
    pendingFiles.current.set(blobUrl, file);
  }, []);

  const handleFileRemove = useCallback((url: string) => {
    if (pendingFiles.current.has(url)) {
      pendingFiles.current.delete(url);
      removedBlobs.current.add(url);
      URL.revokeObjectURL(url);
    } else if (url.startsWith('http')) {
      removedRemoteUrls.current.push(url);
    }
  }, []);

  const handleAddBlock = (type: BlockType) => {
    const defaults: Partial<ContentBlock> =
      type === 'image'
        ? { layout: 'full', media: [] }
        : type === 'youtube'
        ? { layout: 'full', media: [] }
        : { markdown: '' };
    const block: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      order: blocks.length,
      ...defaults,
    };
    dispatch(addBlock({ slug, block }));
  };

  const handleUpdateBlock = (blockId: string, data: Partial<ContentBlock>) => {
    dispatch(updateBlock({ slug, blockId, data }));
  };

  const handleRemoveBlock = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block?.type === 'image' && block.media) {
      block.media.forEach((m) => handleFileRemove(m.url));
    }
    dispatch(removeBlock({ slug, blockId }));
  };

  const handleMoveUp = (index: number) => {
    dispatch(reorderBlocks({ slug, fromIndex: index, toIndex: index - 1 }));
  };

  const handleMoveDown = (index: number) => {
    dispatch(reorderBlocks({ slug, fromIndex: index, toIndex: index + 1 }));
  };

  const handleSettingsSaved = (values: ProjectSettingsFormValues) => {
    const savedBrands: Brand[] = (values.brands ?? []).map((b) => ({
      id: b.id!,
      name: b.name!,
      logoUrl: b.logoUrl ?? '',
      socialUrl: b.socialUrl,
      review: b.review,
    }));
    const savedTags = (values.tags ?? []).map((t) => t.value!);

    dispatch(
      updateSettings({
        slug,
        brands: savedBrands,
        tags: savedTags,
        filmedAt: values.filmedAt ?? '',
      })
    );

    dispatch(
      updateNavItem({
        id: routeId,
        data: {
          label: values.label,
          pinned: !!values.pinned,
          hideFromHome: !!values.hideFromHome,
        },
      })
    );
    settingsModal.close();
  };

  const defaultProjectFormValues: ProjectSettingsFormValues = {
    label: typeof pageLabel === 'string' ? pageLabel : '',
    filmedAt: filmedAt,
    pinned: !!navItem?.pinned,
    hideFromHome: !!navItem?.hideFromHome,
    tagInput: '',
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      logoUrl: b.logoUrl,
      socialUrl: b.socialUrl,
      review: b.review,
    })),
    tags: tags.map((t) => ({ value: t })),
  };

  if (loading && !effectivePage) {
    return (
      <div className="flex flex-col gap-6 w-full px-3 md:px-6 xl:px-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-6 w-full px-3 md:px-6 xl:px-24">
      {isSaving && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <p className="text-white text-sm font-mono uppercase tracking-wider">
            Saving...
          </p>
        </div>
      )}

      <div className="px-2 md:px-0 relative overflow-hidden border-y border-zinc-800/50 rounded-lg">
        <div className="absolute inset-0 pointer-events-none">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        <div className="relative z-10 py-3 px-1">
          {pageLabel && (
            <div className="flex flex-col">
              {/* Desktop: title + settings inline, brands on far right */}
              <div className="hidden md:flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-white text-2xl font-mono uppercase tracking-wider">
                    {pageLabel}
                  </h1>
                  {isAdmin && (
                    <button
                      onClick={() => settingsModal.open()}
                      className="text-zinc-600 hover:text-white transition-colors cursor-pointer"
                      title="Project Settings"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </button>
                  )}
                </div>
                {brands.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 text-[10px] xl:text-xs font-mono uppercase tracking-wider">
                      Brands:
                    </span>
                    {brands.map((brand) => {
                      const avatar = (
                        <div
                          className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                          title={brand.name}
                        >
                          <BrandAvatar brand={brand} />
                        </div>
                      );
                      return brand.socialUrl ? (
                        <a
                          key={brand.id}
                          href={brand.socialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {avatar}
                        </a>
                      ) : (
                        <div key={brand.id}>{avatar}</div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile: title with settings icon space-between */}
              <div className="flex md:hidden items-start justify-between gap-3 mt-2">
                <h1 className="text-white text-2xl font-mono uppercase tracking-wider">
                  {pageLabel}
                </h1>
                {isAdmin && (
                  <button
                    onClick={() => settingsModal.open()}
                    className="text-zinc-600 hover:text-white transition-colors cursor-pointer shrink-0 mt-1"
                    title="Project Settings"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>
                )}
              </div>

              {filmedAt && (
                <p className="text-zinc-600 text-[10px] xl:text-xs font-mono">
                  Filmed{' '}
                  {new Date(filmedAt + 'T00:00:00').toLocaleDateString(
                    'en-US',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </p>
              )}
              {brands.length > 0 && (
                <div className="flex md:hidden items-center gap-2 mt-2">
                  <span className="text-zinc-600 text-[10px] xl:text-xs font-mono uppercase tracking-wider">
                    Brands:
                  </span>
                  {brands.map((brand) => {
                    const avatar = (
                      <div
                        className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                        title={brand.name}
                      >
                        <BrandAvatar brand={brand} />
                      </div>
                    );
                    return brand.socialUrl ? (
                      <a
                        key={brand.id}
                        href={brand.socialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {avatar}
                      </a>
                    ) : (
                      <div key={brand.id}>{avatar}</div>
                    );
                  })}
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] xl:text-xs font-mono text-zinc-300 bg-zinc-800/50 border border-zinc-700 rounded px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {isAdmin && (
                <div className="flex items-center gap-3 mt-3">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="text-[10px] xl:text-xs uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 rounded px-3 py-1 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-[10px] xl:text-xs uppercase tracking-wider text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="text-[10px] xl:text-xs uppercase tracking-wider text-zinc-600 hover:text-white transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
              {error && (
                <p className="text-red-500 text-[10px] xl:text-xs">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {blocks.length === 0 && !editing && (
        <p className="text-zinc-700 text-sm text-center py-20">
          No content yet
        </p>
      )}

      <div className="flex flex-col gap-4">
        {blocks.map((block, index) =>
          editing ? (
            <BlockWrapper
              key={block.id}
              index={index}
              total={blocks.length}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onDelete={() => handleRemoveBlock(block.id)}
            >
              {block.type === 'image' ? (
                <ImageBlockEditor
                  block={block}
                  slug={slug}
                  brands={brands}
                  onChange={(data) => handleUpdateBlock(block.id, data)}
                  onFileAdd={handleFileAdd}
                  onFileRemove={handleFileRemove}
                />
              ) : block.type === 'youtube' ? (
                <YouTubeBlockEditor
                  block={block}
                  brands={brands}
                  onChange={(data) => handleUpdateBlock(block.id, data)}
                />
              ) : block.type === 'spacer' ? (
                <div className="flex items-center justify-center h-8 text-zinc-700 text-[10px] xl:text-xs uppercase tracking-wider border border-dashed border-zinc-800 rounded">
                  Spacer — 32px
                </div>
              ) : (
                <RichTextEditor
                  block={block}
                  onChange={(data) => handleUpdateBlock(block.id, data)}
                />
              )}
            </BlockWrapper>
          ) : (
            <BlockRenderer key={block.id} block={block} brands={brands} />
          )
        )}
      </div>

      {editing && <AddBlockButton onAdd={handleAddBlock} />}

      {renderSettingsModal(
        <ProjectSettingsForm
          slug={slug}
          routeId={routeId}
          defaultValues={defaultProjectFormValues}
          onSaved={handleSettingsSaved}
          onStateChange={setSettingsState}
        />,
        {
          size: 'md',
          cancelButtonProps: {
            label: 'Close',
            onClick: () => settingsModal.close(),
          },
          okButtonProps: {
            label: settingsState.saving ? 'Saving...' : 'Save',
            disabled: !settingsState.hasChanges || settingsState.saving,
            onClick: () => settingsState.save(),
          },
        }
      )}
    </div>
  );
}
