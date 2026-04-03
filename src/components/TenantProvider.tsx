"use client";

import { createContext, useContext, useEffect } from "react";
import { useAppDispatch } from "@/store";
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

  useEffect(() => {
    if (userId) {
      dispatch(fetchNavItems(userId));
    }
  }, [dispatch, userId]);

  return (
    <TenantContext.Provider value={{ userId, username, displayName, tagline }}>
      {children}
    </TenantContext.Provider>
  );
}
