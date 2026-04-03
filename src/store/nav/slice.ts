import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { FirestoreNavItem } from "@/lib/types";
import { API_ROUTES } from "@/routeConfig/apiRoutes";
import { getAuthToken } from "@/store/auth/slice";
import { initialState } from "./initialState";

export const fetchNavItems = createAsyncThunk(
  "nav/fetch",
  async (userId: string, { rejectWithValue }) => {
    const res = await fetch(API_ROUTES.list(userId));
    if (!res.ok) {
      const body = await res.json();
      return rejectWithValue(body.error || "Failed to fetch routes");
    }
    return (await res.json()) as FirestoreNavItem[];
  }
);

export const addNavItem = createAsyncThunk(
  "nav/add",
  async (item: Omit<FirestoreNavItem, "id"> & { userId?: string }, { rejectWithValue }) => {
    const token = getAuthToken();
    const res = await fetch(API_ROUTES.create, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const body = await res.json();
      return rejectWithValue(body.error || "Failed to add route");
    }
    return (await res.json()) as FirestoreNavItem;
  }
);

export const updateNavItem = createAsyncThunk(
  "nav/update",
  async (
    { id, data }: { id: string; data: Partial<Omit<FirestoreNavItem, "id">> },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { nav: { items: FirestoreNavItem[] } };
    const prev = state.nav.items.find((i) => i.id === id);
    const token = getAuthToken();
    const res = await fetch(API_ROUTES.update(id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      return rejectWithValue({ error: body.error || "Failed to update route", id, prev });
    }
    return { id, data };
  }
);

export const removeNavItem = createAsyncThunk(
  "nav/remove",
  async (id: string, { getState, rejectWithValue }) => {
    const state = getState() as { nav: { items: FirestoreNavItem[] } };
    const prev = state.nav.items.find((i) => i.id === id);
    const token = getAuthToken();
    const res = await fetch(API_ROUTES.delete(id), {
      method: "DELETE",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!res.ok) {
      const body = await res.json();
      return rejectWithValue({ error: body.error || "Failed to delete route", prev });
    }
    return id;
  }
);

const navSlice = createSlice({
  name: "nav",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNavItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNavItems.fulfilled, (state, action: PayloadAction<FirestoreNavItem[]>) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchNavItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addNavItem.pending, (state) => {
        state.error = null;
      })
      .addCase(addNavItem.fulfilled, (state, action: PayloadAction<FirestoreNavItem>) => {
        state.items.push(action.payload);
      })
      .addCase(addNavItem.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateNavItem.pending, (state, action) => {
        const { id, data } = action.meta.arg;
        const item = state.items.find((i) => i.id === id);
        if (item) Object.assign(item, data);
      })
      .addCase(updateNavItem.rejected, (state, action) => {
        const { id, prev } = action.payload as { error: string; id: string; prev?: FirestoreNavItem };
        if (prev) {
          const idx = state.items.findIndex((i) => i.id === id);
          if (idx !== -1) state.items[idx] = prev;
        }
        state.error = (action.payload as { error: string }).error;
      })
      .addCase(removeNavItem.pending, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.meta.arg);
      })
      .addCase(removeNavItem.rejected, (state, action) => {
        const { prev, error } = action.payload as { error: string; prev?: FirestoreNavItem };
        if (prev) state.items.push(prev);
        state.error = error;
      });
  },
});

export default navSlice.reducer;
