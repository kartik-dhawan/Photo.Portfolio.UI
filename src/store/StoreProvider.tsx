"use client";

import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { store, useAppDispatch } from ".";
import { initAuth, checkTokenExpiry } from "./auth";
import { fetchNavItems } from "./nav";

function StoreInit() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initAuth());
    dispatch(fetchNavItems());
  }, [dispatch]);

  // Check token expiry every minute
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(checkTokenExpiry());
    }, 60_000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return null;
}

export default function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <StoreInit />
      {children}
    </Provider>
  );
}
