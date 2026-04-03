import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { UserRole } from "@/lib/types";
import { initialState } from "./initialState";

async function loadAuth() {
  const { getFirebaseAuth } = await import("@/firebase/client");
  const firebaseAuth = await import("firebase/auth");
  return { auth: getFirebaseAuth(), firebaseAuth };
}

const TOKEN_KEY = "auth_token";
const EXPIRY_KEY = "auth_token_expiry";

function saveToken(token: string, expirationTime: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRY_KEY, expirationTime);
}

function clearTokenStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

function isTokenValid(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!token || !expiry) return false;
  return Date.now() < Number(expiry);
}

/** Get the stored auth token for API calls */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

interface AuthPayload {
  uid: string;
  username: string;
  role: UserRole;
  token: string;
}

export const initAuth = createAsyncThunk(
  "auth/init",
  async (): Promise<AuthPayload | null> => {
    if (!isTokenValid()) {
      clearTokenStorage();
    }

    const { auth, firebaseAuth } = await loadAuth();

    return new Promise((resolve) => {
      firebaseAuth.onAuthStateChanged(auth, async (u) => {
        if (u) {
          const result = await u.getIdTokenResult();
          saveToken(
            result.token,
            String(new Date(result.expirationTime).getTime())
          );
          resolve({
            uid: u.uid,
            username: (result.claims.username as string) ?? "",
            role: (result.claims.role as UserRole) ?? "admin",
            token: result.token,
          });
        } else {
          const valid = isTokenValid();
          if (!valid) clearTokenStorage();
          resolve(null);
        }
      });
    });
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthPayload> => {
    const { auth, firebaseAuth } = await loadAuth();
    const cred = await firebaseAuth.signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const result = await cred.user.getIdTokenResult();
    saveToken(
      result.token,
      String(new Date(result.expirationTime).getTime())
    );
    return {
      uid: cred.user.uid,
      username: (result.claims.username as string) ?? "",
      role: (result.claims.role as UserRole) ?? "admin",
      token: result.token,
    };
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  const { auth, firebaseAuth } = await loadAuth();
  await firebaseAuth.signOut(auth);
  clearTokenStorage();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    checkTokenExpiry(state) {
      if (state.isAuthenticated && typeof window !== "undefined" && !isTokenValid()) {
        clearTokenStorage();
        state.isAuthenticated = false;
        state.uid = null;
        state.username = null;
        state.role = null;
        state.token = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        initAuth.fulfilled,
        (state, action: PayloadAction<AuthPayload | null>) => {
          if (action.payload) {
            state.uid = action.payload.uid;
            state.username = action.payload.username;
            state.role = action.payload.role;
            state.token = action.payload.token;
            state.isAuthenticated = true;
          }
          state.loading = false;
        }
      )
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<AuthPayload>) => {
          state.uid = action.payload.uid;
          state.username = action.payload.username;
          state.role = action.payload.role;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
      )
      .addCase(login.rejected, (state) => {
        state.isAuthenticated = false;
        state.uid = null;
        state.username = null;
        state.role = null;
        state.token = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.uid = null;
        state.username = null;
        state.role = null;
        state.token = null;
      });
  },
});

export const { checkTokenExpiry } = authSlice.actions;
export default authSlice.reducer;
