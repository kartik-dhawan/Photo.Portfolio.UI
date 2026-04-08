import { ReactNode } from "react";
import { SocialLink } from "./socials";

export type UserRole = "superAdmin" | "admin";

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  tagline: string;
  email: string;
  role: UserRole;
  customDomain: string | null;
  aboutText: string;
  socials: SocialLink[];
  heroTitle: string;
  heroSubtitle: string;
  themeId: string;
  socialHandles?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface NavItem {
  id: string;
  route: string;
  label: ReactNode;
  hidden: boolean;
  isNotLink: boolean;
  sectionName: string;
  order: number;
  pinned?: boolean;
  hideFromHome?: boolean;
  excludeFromGallery?: boolean;
  userId?: string;
}

export type FirestoreNavItem = Omit<NavItem, "label"> & { label: string };
