import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { initialState } from './initialState';

// Firebase client SDK must be dynamically imported — static imports would
// pull it into the SSR bundle where browser APIs (localStorage, etc.) are
// unavailable, causing the build to fail. This helper centralises the
// dynamic import so each thunk doesn't repeat it.
async function loadAuth() {
  const { getFirebaseAuth } = await import('@/firebase/client');
  const firebaseAuth = await import('firebase/auth');
  return { auth: getFirebaseAuth(), firebaseAuth };
}

const TOKEN_KEY = 'admin_token';
const EXPIRY_KEY = 'admin_token_expiry';

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

export const initAuth = createAsyncThunk(
  'auth/init',
  async (_, { dispatch }) => {
    if (!isTokenValid()) {
      clearTokenStorage();
    }

    const { auth, firebaseAuth } = await loadAuth();

    return new Promise<boolean>((resolve) => {
      firebaseAuth.onAuthStateChanged(auth, async (u) => {
        if (u) {
          const result = await u.getIdTokenResult();
          saveToken(
            result.token,
            String(new Date(result.expirationTime).getTime())
          );
          resolve(true);
        } else {
          const valid = isTokenValid();
          if (!valid) clearTokenStorage();
          resolve(valid);
        }
      });
    });
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const { auth, firebaseAuth } = await loadAuth();
    const cred = await firebaseAuth.signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const result = await cred.user.getIdTokenResult();
    saveToken(result.token, String(new Date(result.expirationTime).getTime()));
    return true;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  const { auth, firebaseAuth } = await loadAuth();
  await firebaseAuth.signOut(auth);
  clearTokenStorage();
  return false;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    checkTokenExpiry(state) {
      if (state.isAdmin && !isTokenValid()) {
        clearTokenStorage();
        state.isAdmin = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.fulfilled, (state, action: PayloadAction<boolean>) => {
        state.isAdmin = action.payload;
        state.loading = false;
      })
      .addCase(login.fulfilled, (state) => {
        state.isAdmin = true;
      })
      .addCase(login.rejected, (state) => {
        state.isAdmin = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAdmin = false;
      });
  },
});

export const { checkTokenExpiry } = authSlice.actions;
export default authSlice.reducer;
