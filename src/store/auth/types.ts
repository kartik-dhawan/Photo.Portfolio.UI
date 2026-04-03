import { UserRole } from "@/lib/types";

export interface AuthState {
  uid: string | null;
  username: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  token: string | null;
}
