"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchNavItems } from "@/store/nav";

interface TenantCtx {
  userId: string;
  username: string;
  displayName: string;
  tagline: string;
}

const TenantContext = createContext<TenantCtx>({
  userId: "",
  username: "",
  displayName: "",
  tagline: "",
});

export function useTenant() {
  return useContext(TenantContext);
}

interface Props extends TenantCtx {
  children: React.ReactNode;
}

export default function TenantProvider({ userId, username, displayName, tagline, children }: Props) {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((s) => s.nav);
  const fetchedForUser = useRef<string>("");

  useEffect(() => {
    // Only fetch if userId changed or items are empty
    if (userId && (fetchedForUser.current !== userId || items.length === 0)) {
      fetchedForUser.current = userId;
      dispatch(fetchNavItems(userId));
    }
  }, [dispatch, userId, items.length]);

  return (
    <TenantContext.Provider value={{ userId, username, displayName, tagline }}>
      {children}
    </TenantContext.Provider>
  );
}
