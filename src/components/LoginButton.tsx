"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { login, logout } from "@/store/auth";
import LoginForm from "@/components/forms/auth/LoginForm";
import { LoginFormValues } from "@/components/forms/auth/schema";

export default function LoginButton() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState("");

  if (isAuthenticated) {
    return (
      <button
        onClick={async () => {
          await dispatch(logout());
          window.location.href = "/";
        }}
        className="text-zinc-600 hover:text-zinc-400 transition-colors text-[10px] uppercase tracking-wider cursor-pointer"
      >
        Logout
      </button>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-zinc-700 hover:text-zinc-500 transition-colors text-[10px] uppercase tracking-wider cursor-pointer"
      >
        Login
      </button>
    );
  }

  const handleSubmit = async (data: LoginFormValues) => {
    setServerError("");
    try {
      const result = await dispatch(login(data)).unwrap();
      setShowForm(false);
      // Hard navigate to the logged-in user's portfolio
      // (router.push won't re-render the server layout for the new user)
      if (result.username) {
        window.location.href = `/${result.username}`;
      } else {
        window.location.reload();
      }
    } catch {
      setServerError("Invalid credentials");
    }
  };

  return (
    <LoginForm
      onSubmit={handleSubmit}
      onCancel={() => {
        setShowForm(false);
        setServerError("");
      }}
      serverError={serverError}
    />
  );
}
