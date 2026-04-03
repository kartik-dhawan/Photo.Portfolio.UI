"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useAppDispatch } from "@/store";
import { fetchNavItems } from "@/store/nav";

interface TenantCtx {
  userId: string;
  username: string;
  displayName: string;
  tagline: string;
  /** Prefix a route path with /{username} if needed */
  prefixRoute: (route: string) => string;
}

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

const TenantContext = createContext<TenantCtx>({
  userId: "",
  username: "",
  displayName: "",
  tagline: "",
  prefixRoute: (r) => r,
});

export function useTenant() {
  return useContext(TenantContext);
}

interface Props {
  userId: string;
  username: string;
  displayName: string;
  tagline: string;
  children: React.ReactNode;
}

export default function TenantProvider({ userId, username, displayName, tagline, children }: Props) {
  const dispatch = useAppDispatch();
  const lastFetched = useRef("");

  useEffect(() => {
    if (userId && lastFetched.current !== userId) {
      lastFetched.current = userId;
      dispatch(fetchNavItems(userId));
    }
  }, [dispatch, userId]);

  // Default user gets clean URLs (/slug), others get /{username}/slug
  const isDefaultUser = username === DEFAULT_USERNAME;
  const prefixRoute = (route: string) =>
    isDefaultUser ? route : `/${username}${route}`;

  return (
    <TenantContext.Provider value={{ userId, username, displayName, tagline, prefixRoute }}>
      {children}
    </TenantContext.Provider>
  );
}
