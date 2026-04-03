"use client";

import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { store, useAppDispatch, useAppSelector } from ".";
import { initAuth, checkTokenExpiry } from "./auth";
import { fetchNavItems } from "./nav";

const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? "";

function StoreInit() {
  const dispatch = useAppDispatch();
  const { uid } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  // Fetch nav items once we know the userId (from auth or default)
  useEffect(() => {
    const userId = uid ?? DEFAULT_USER_ID;
    if (userId) {
      dispatch(fetchNavItems(userId));
    }
  }, [dispatch, uid]);

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
