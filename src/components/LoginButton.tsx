"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store";
import { login, logout } from "@/store/auth";
import LoginForm from "@/components/forms/auth/LoginForm";
import { LoginFormValues } from "@/components/forms/auth/schema";

export default function LoginButton() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, username } = useAppSelector((s) => s.auth);
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState("");

  if (isAuthenticated) {
    return (
      <button
        onClick={() => {
          dispatch(logout());
          router.push("/");
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
      // Redirect to the logged-in user's portfolio
      if (result.username) {
        router.push(`/${result.username}`);
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
