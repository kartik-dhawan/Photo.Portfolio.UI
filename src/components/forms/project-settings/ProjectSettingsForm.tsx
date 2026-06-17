'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import BrandAvatar from '@/components/common/BrandAvatar';
import { Brand } from '@/store/content';
import { useFetchAllBrands, useUpdatePageSettings, useUpdateRouteLabel, useUploadMedia } from '@/hooks';
import { sectionNamesEqual } from '@/lib/section-name';
import {
  projectSettingsSchema,
  ProjectSettingsFormValues,
  addBrandSchema,
  AddBrandFormValues,
} from './schema';

interface ExistingBrand extends Brand {
  projectSlug: string;
  projectName: string;
}

interface Props {
  slug: string;
  routeId: string;
  defaultValues: ProjectSettingsFormValues;
  onSaved: (values: ProjectSettingsFormValues) => void;
  onStateChange?: (state: {
    hasChanges: boolean;
    saving: boolean;
    save: () => Promise<void>;
  }) => void;
}

export default function ProjectSettingsForm({
  slug,
  routeId,
  defaultValues: initialValues,
  onSaved,
  onStateChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pendingFiles = useRef<Map<string, File>>(new Map());

  const { data: allBrands, loading: loadingBrands } = useFetchAllBrands();
  const { updateSettings } = useUpdatePageSettings(slug);
  const { updateRoute } = useUpdateRouteLabel(routeId);
  const { upload: uploadFile } = useUploadMedia(slug);

  // Main settings form
  const {
    register,
    control,
    getValues,
    setValue,
    watch,
    reset: resetMain,
    formState: { isDirty },
  } = useForm<ProjectSettingsFormValues>({
    resolver: yupResolver(projectSettingsSchema),
    defaultValues: initialValues,
  });

  const tagInput = watch('tagInput');
  const isShareable = watch('isShareable');
  const wasShareable = initialValues.isShareable ?? false;

  const {
    fields: brandFields,
    append: appendBrand,
    remove: removeBrand,
  } = useFieldArray({ control, name: 'brands' });

  const {
    fields: tagFields,
    append: appendTag,
    remove: removeTag,
  } = useFieldArray({ control, name: 'tags' });

  // Watch brands for the "pick existing" dedup
  const watchedBrands = useWatch({ control, name: 'brands' });

  // Add brand sub-form
  const addBrandForm = useForm<AddBrandFormValues>({
    resolver: yupResolver(addBrandSchema),
    defaultValues: { name: '', socialUrl: '', review: '', logoPreview: '' },
  });

  const logoPreview = addBrandForm.watch('logoPreview');

  // Sync when parent data actually changes (not on every render)
  const prevInitialRef = useRef('');
  useEffect(() => {
    const key = JSON.stringify(initialValues);
    if (key === prevInitialRef.current) return;
    prevInitialRef.current = key;
    resetMain(initialValues);
  }, [initialValues, resetMain]);

  // Dedup existing brands
  const addedNames = new Set(
    (watchedBrands ?? []).map((b) => b.name.toLowerCase())
  );
  const uniqueExisting = allBrands.reduce<ExistingBrand[]>((acc, b) => {
    const key = b.name.toLowerCase();
    if (
      !addedNames.has(key) &&
      !acc.some((a) => a.name.toLowerCase() === key)
    ) {
      acc.push(b);
    }
    return acc;
  }, []);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    pendingFiles.current.set(blobUrl, file);
    addBrandForm.setValue('logoPreview', blobUrl);
    e.target.value = '';
  };

  const onAddBrand = (data: AddBrandFormValues) => {
    appendBrand({
      id: crypto.randomUUID(),
      name: data.name,
      logoUrl: data.logoPreview || '',
      socialUrl: data.socialUrl || undefined,
      review: data.review || undefined,
    });
    addBrandForm.reset();
  };

  const handlePickExisting = (existing: ExistingBrand) => {
    appendBrand({
      id: crypto.randomUUID(),
      name: existing.name,
      logoUrl: existing.logoUrl,
      socialUrl: existing.socialUrl,
      review: '',
    });
  };

  const handleRemoveBrand = (index: number) => {
    const brand = brandFields[index];
    if (brand?.logoUrl && pendingFiles.current.has(brand.logoUrl)) {
      URL.revokeObjectURL(brand.logoUrl);
      pendingFiles.current.delete(brand.logoUrl);
    }
    removeBrand(index);
  };

  const handleAddTag = () => {
    const value = (tagInput ?? '').trim();
    if (value && !tagFields.some((t) => t.value === value)) {
      appendTag({ value });
      setValue('tagInput', '');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const values = getValues();

      // Upload pending logo files
      const blobToRemote = new Map<string, string>();
      const uploads = Array.from(pendingFiles.current.entries()).map(
        async ([blobUrl, file]) => {
          const { publicUrl } = await uploadFile(file);
          blobToRemote.set(blobUrl, publicUrl);
          URL.revokeObjectURL(blobUrl);
        }
      );

      await Promise.all(uploads);
      pendingFiles.current.clear();

      const finalBrands: Brand[] = (values.brands ?? []).map((b) => ({
        id: b.id!,
        name: b.name!,
        logoUrl: blobToRemote.get(b.logoUrl ?? '') ?? b.logoUrl ?? '',
        socialUrl: b.socialUrl || undefined,
        review: b.review || undefined,
      }));

      const finalTags = (values.tags ?? []).map((t) => t.value!);
      const filmedAt = values.filmedAt ?? '';
      const sectionNames = {
        youtube: values.youtubeTitle || undefined,
        instagram: values.instagramTitle || undefined,
      };

      const routeData: Record<string, unknown> = {};
      if (values.label !== initialValues.label) routeData.label = values.label;
      if (!sectionNamesEqual(values.sectionName, initialValues.sectionName)) {
        routeData.sectionName = values.sectionName;
      }
      if (values.pinned !== initialValues.pinned) routeData.pinned = !!values.pinned;
      if (values.hideFromHome !== initialValues.hideFromHome) routeData.hideFromHome = !!values.hideFromHome;
      if (values.excludeFromGallery !== initialValues.excludeFromGallery) routeData.excludeFromGallery = !!values.excludeFromGallery;
      if (values.isShareable !== initialValues.isShareable) routeData.isShareable = !!values.isShareable;

      await Promise.all([
        updateSettings({ brands: finalBrands, tags: finalTags, filmedAt, sectionNames }),
        Object.keys(routeData).length > 0 ? updateRoute(routeData) : Promise.resolve(),
      ]);

      onSaved({
        ...values,
        brands: finalBrands.map((b) => ({
          id: b.id,
          name: b.name,
          logoUrl: b.logoUrl,
          socialUrl: b.socialUrl,
          review: b.review,
        })),
        tags: finalTags.map((t) => ({ value: t })),
      });
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Notify parent of state changes
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const stableSave = useCallback(() => handleSaveRef.current(), []);

  useEffect(() => {
    onStateChange?.({ hasChanges: isDirty, saving, save: stableSave });
  }, [isDirty, saving, onStateChange, stableSave]);

  const inputClass =
    'bg-transparent border border-zinc-800 rounded px-3 py-2 text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700';

  return (
    <fieldset
      disabled={saving}
      className="flex flex-col gap-5 disabled:opacity-50 disabled:pointer-events-none"
    >
      {/* Route label */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Route Label
        </span>
        <input
          {...register('label')}
          type="text"
          className={inputClass}
          placeholder="Route label"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Section Name
        </span>
        <input
          {...register('sectionName')}
          type="text"
          className={inputClass}
          placeholder="Section name (sidebar grouping)"
        />
      </div>

      {/* Visibility toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            {...register('pinned', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked) setValue('hideFromHome', false);
              },
            })}
            type="checkbox"
            className="w-4 h-4 accent-white cursor-pointer shrink-0"
          />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Pin to top of home
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            {...register('hideFromHome', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked) setValue('pinned', false);
              },
            })}
            type="checkbox"
            className="w-4 h-4 accent-white cursor-pointer shrink-0"
          />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Hide from home page
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            {...register('excludeFromGallery')}
            type="checkbox"
            className="w-4 h-4 accent-white cursor-pointer shrink-0"
          />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Exclude photos from main gallery
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer col-span-2">
          <input
            {...register('isShareable')}
            type="checkbox"
            className="w-4 h-4 accent-white cursor-pointer shrink-0"
          />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Make content from this page shareable (others can reuse images)
          </span>
        </label>
        {wasShareable && !isShareable && (
          <p className="col-span-2 text-[10px] font-mono text-zinc-500 bg-zinc-800/50 border border-zinc-700 rounded px-3 py-2">
            Note: Images already referenced by other users will continue to work — this only prevents new picks.
          </p>
        )}
      </div>

      {/* Filmed date */}
      <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Filmed On
        </span>
        <input
          {...register('filmedAt')}
          type="date"
          className={`${inputClass} [color-scheme:dark]`}
        />
      </div>

      {/* Section titles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            YouTube Section Title
          </span>
          <input
            {...register('youtubeTitle')}
            type="text"
            className={inputClass}
            placeholder="YouTube References"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Instagram Section Title
          </span>
          <input
            {...register('instagramTitle')}
            type="text"
            className={inputClass}
            placeholder="Instagram References"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Tags
        </span>
        <div
          className="flex flex-wrap items-center gap-1.5 bg-transparent border border-zinc-800 rounded px-3 py-2 cursor-text"
          onClick={() => document.getElementById('tag-input')?.focus()}
        >
          {tagFields.map((field, index) => (
            <span
              key={field.id}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-800 rounded px-2 py-0.5"
            >
              {field.value}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
              >
                &times;
              </button>
            </span>
          ))}
          <input
            id="tag-input"
            type="text"
            {...register('tagInput')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
              if (e.key === 'Backspace' && !tagInput && tagFields.length > 0) {
                removeTag(tagFields.length - 1);
              }
            }}
            placeholder={
              tagFields.length === 0 ? 'Type a tag and press Enter' : ''
            }
            className="bg-transparent text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700 min-w-[80px] flex-1"
          />
        </div>
      </div>

      {/* Existing brands */}
      {brandFields.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Brands
          </span>
          {brandFields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-3 border border-zinc-800 rounded px-3 py-2"
            >
              <BrandAvatar brand={field as unknown as Brand} />
              <span className="text-white text-sm font-mono flex-1 truncate">
                {field.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveBrand(index)}
                className="text-zinc-600 hover:text-red-400 text-xs transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add brand */}
      <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Add Brand associations
          </span>
          <button
            type="button"
            onClick={() => setMode(mode === 'new' ? 'existing' : 'new')}
            className="text-[10px] uppercase tracking-wider text-zinc-600 hover:text-zinc-300 font-mono transition-colors cursor-pointer"
          >
            {mode === 'new' ? 'Pick existing' : 'Create new'}
          </button>
        </div>

        {mode === 'existing' ? (
          <div className="flex flex-col gap-2">
            {loadingBrands && (
              <span className="text-zinc-600 text-xs font-mono">
                Loading...
              </span>
            )}
            {!loadingBrands && uniqueExisting.length === 0 && (
              <span className="text-zinc-700 text-xs font-mono">
                No other brands available
              </span>
            )}
            {uniqueExisting.map((brand) => (
              <button
                key={`${brand.id}-${brand.projectSlug}`}
                type="button"
                onClick={() => handlePickExisting(brand)}
                className="flex items-center gap-3 border border-zinc-800 rounded px-3 py-2 hover:border-zinc-600 transition-colors cursor-pointer text-left"
              >
                <BrandAvatar brand={brand} />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-white text-sm font-mono truncate">
                    {brand.name}
                  </span>
                  <span className="text-zinc-600 text-[10px] font-mono truncate">
                    from {brand.projectName}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <form
            onSubmit={addBrandForm.handleSubmit(onAddBrand)}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-10 h-10 rounded-full border border-dashed border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-zinc-500 transition-colors"
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-zinc-600 text-lg">+</span>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
              <input
                {...addBrandForm.register('name')}
                type="text"
                placeholder="Brand name"
                className={`${inputClass} flex-1`}
              />
            </div>
            {addBrandForm.formState.errors.name && (
              <span className="text-red-500 text-[10px]">
                {addBrandForm.formState.errors.name.message}
              </span>
            )}

            <input
              {...addBrandForm.register('socialUrl')}
              type="url"
              placeholder="Social URL (optional)"
              className={inputClass}
            />
            {addBrandForm.formState.errors.socialUrl && (
              <span className="text-red-500 text-[10px]">
                {addBrandForm.formState.errors.socialUrl.message}
              </span>
            )}

            <textarea
              {...addBrandForm.register('review')}
              placeholder="Review (optional)"
              rows={3}
              className={`${inputClass} resize-none`}
            />

            <button
              type="submit"
              className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 rounded px-3 py-1.5 transition-colors cursor-pointer self-start"
            >
              Add Brand
            </button>
          </form>
        )}
      </div>

      {/* Error */}
      {error && <span className="text-red-500 text-[10px]">{error}</span>}
    </fieldset>
  );
}
