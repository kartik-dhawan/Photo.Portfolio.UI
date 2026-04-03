import { AuthState } from "./types";

export const initialState: AuthState = {
  uid: null,
  username: null,
  role: null,
  isAuthenticated: false,
  loading: true,
  token: null,
};
