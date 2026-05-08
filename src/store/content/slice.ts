import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import { getAuthToken } from "@/store/auth/slice";
import { Brand, ContentBlock, PageContent, SectionNames } from "./types";
import { initialState } from "./initialState";

export const fetchPageContent = createAsyncThunk(
  "content/fetch",
  async ({ slug, userId }: { slug: string; userId: string }, { rejectWithValue }) => {
    const res = await fetch(CONTENT_API_ROUTES.get(slug, userId));
    if (!res.ok) {
      const body = await res.json();
      return rejectWithValue(body.error || "Failed to fetch content");
    }
    return (await res.json()) as PageContent;
  }
);

export const savePageContent = createAsyncThunk(
  "content/save",
  async (
    { slug, blocks, brands, userId }: { slug: string; blocks: ContentBlock[]; brands?: Brand[]; userId?: string },
    { rejectWithValue }
  ) => {
    const token = getAuthToken();
    const res = await fetch(CONTENT_API_ROUTES.save(slug), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ blocks, brands, userId }),
    });
    if (!res.ok) {
      const body = await res.json();
      return rejectWithValue(body.error || "Failed to save content");
    }
    return { slug, blocks, brands };
  }
);

export const uploadMedia = createAsyncThunk(
  "content/upload",
  async (
    { slug, file, userId }: { slug: string; file: File; userId: string },
    { rejectWithValue }
  ) => {
    try {
      const { uploadToStorage } = await import("@/lib/upload");
      const { publicUrl, type } = await uploadToStorage(slug, file, userId);
      return { url: publicUrl, type };
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to upload file"
      );
    }
  }
);

export const deleteMedia = createAsyncThunk(
  "content/deleteMedia",
  async (urls: string[], { rejectWithValue }) => {
    const token = getAuthToken();
    const res = await fetch(CONTENT_API_ROUTES.deleteMedia, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ urls }),
    });
    if (!res.ok) {
      const body = await res.json();
      return rejectWithValue(body.error || "Failed to delete media");
    }
  }
);

const contentSlice = createSlice({
  name: "content",
  initialState,
  reducers: {
    setDraft(
      state,
      action: PayloadAction<{ slug: string; blocks: ContentBlock[] }>
    ) {
      state.drafts[action.payload.slug] = action.payload.blocks;
    },
    clearDraft(state, action: PayloadAction<string>) {
      delete state.drafts[action.payload];
      delete state.draftBrands[action.payload];
    },
    setDraftBrands(
      state,
      action: PayloadAction<{ slug: string; brands: Brand[] }>
    ) {
      state.draftBrands[action.payload.slug] = action.payload.brands;
    },
    updateSettings(
      state,
      action: PayloadAction<{
        slug: string;
        brands: Brand[];
        tags: string[];
        filmedAt: string;
        sectionNames?: SectionNames;
      }>
    ) {
      const { slug, brands, tags, filmedAt, sectionNames } = action.payload;
      if (state.pages[slug]) {
        state.pages[slug].brands = brands;
        state.pages[slug].tags = tags;
        state.pages[slug].filmedAt = filmedAt;
        state.pages[slug].sectionNames = sectionNames;
      }
    },
    addBlock(
      state,
      action: PayloadAction<{ slug: string; block: ContentBlock }>
    ) {
      const { slug, block } = action.payload;
      if (!state.drafts[slug]) state.drafts[slug] = [];
      state.drafts[slug].push(block);
    },
    updateBlock(
      state,
      action: PayloadAction<{
        slug: string;
        blockId: string;
        data: Partial<ContentBlock>;
      }>
    ) {
      const { slug, blockId, data } = action.payload;
      const blocks = state.drafts[slug];
      if (!blocks) return;
      const idx = blocks.findIndex((b) => b.id === blockId);
      if (idx !== -1) Object.assign(blocks[idx], data);
    },
    removeBlock(
      state,
      action: PayloadAction<{ slug: string; blockId: string }>
    ) {
      const { slug, blockId } = action.payload;
      if (!state.drafts[slug]) return;
      state.drafts[slug] = state.drafts[slug].filter(
        (b) => b.id !== blockId
      );
    },
    reorderBlocks(
      state,
      action: PayloadAction<{ slug: string; fromIndex: number; toIndex: number }>
    ) {
      const { slug, fromIndex, toIndex } = action.payload;
      const blocks = state.drafts[slug];
      if (!blocks) return;
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, moved);
      blocks.forEach((b, i) => {
        b.order = i;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPageContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPageContent.fulfilled,
        (state, action: PayloadAction<PageContent>) => {
          state.pages[action.payload.slug] = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchPageContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(savePageContent.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(savePageContent.fulfilled, (state, action) => {
        const { slug, blocks, brands } = action.payload;
        const now = new Date().toISOString();
        const existing = state.pages[slug];
        state.pages[slug] = {
          ...existing,
          slug,
          blocks,
          brands,
          updatedAt: now,
          createdAt: existing?.createdAt || now,
        };
        delete state.drafts[slug];
        delete state.draftBrands[slug];
        state.saving = false;
      })
      .addCase(savePageContent.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setDraft,
  clearDraft,
  setDraftBrands,
  updateSettings,
  addBlock,
  updateBlock,
  removeBlock,
  reorderBlocks,
} = contentSlice.actions;
export default contentSlice.reducer;
