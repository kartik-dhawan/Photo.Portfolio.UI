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
        onClick={() => dispatch(logout())}
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
        Admin
      </button>
    );
  }

  const handleSubmit = async (data: LoginFormValues) => {
    setServerError("");
    try {
      await dispatch(login(data)).unwrap();
      setShowForm(false);
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
