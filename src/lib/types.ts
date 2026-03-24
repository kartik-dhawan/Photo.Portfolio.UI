import { ReactNode } from "react";

export interface NavItem {
  id: string;
  route: string;
  label: ReactNode;
  hidden: boolean;
  isNotLink: boolean;
  sectionName: string;
  order: number;
}

export type FirestoreNavItem = Omit<NavItem, "label"> & { label: string };
