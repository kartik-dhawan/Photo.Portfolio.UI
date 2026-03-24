import { FirestoreNavItem } from "@/lib/types";

export interface NavState {
  items: FirestoreNavItem[];
  loading: boolean;
  error: string | null;
}
