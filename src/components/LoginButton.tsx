"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { login, logout } from "@/store/auth";
import LoginForm from "@/components/forms/auth/LoginForm";
import { LoginFormValues } from "@/components/forms/auth/schema";

function FullScreenLoader({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest">
          {message}
        </p>
      </div>
    </div>
  );
}

export default function LoginButton() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (loggingIn) return <FullScreenLoader message="Logging in..." />;
  if (loggingOut) return <FullScreenLoader message="Logging out..." />;

  if (isAuthenticated) {
    return (
      <button
        onClick={async () => {
          setLoggingOut(true);
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
      setLoggingIn(true);
      const result = await dispatch(login(data)).unwrap();
      setShowForm(false);
      if (result.username) {
        window.location.href = `/${result.username}`;
      } else {
        window.location.reload();
      }
    } catch {
      setLoggingIn(false);
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
