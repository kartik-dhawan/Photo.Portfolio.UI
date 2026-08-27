"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { login, logout } from "@/store/auth";
import LoginForm from "@/components/forms/auth/LoginForm";
import { LoginFormValues } from "@/components/forms/auth/schema";
import { toast } from "@/lib/toast";

type View = "login" | "reset";

async function sendResetEmail(email: string): Promise<void> {
  const { getFirebaseAuth } = await import("@/firebase/client");
  const { sendPasswordResetEmail } = await import("firebase/auth");
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

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

function ResetForm({
  onBack,
  prefillEmail,
}: {
  onBack: () => void;
  prefillEmail: string;
}) {
  const [email, setEmail] = useState(prefillEmail);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!email) return;
    setSending(true);
    setError("");
    try {
      await sendResetEmail(email);
      toast(`Reset link sent to ${email}`);
      onBack();
    } catch {
      setError("Could not send reset email. Check the address and try again.");
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        autoFocus
        className="bg-transparent border-b border-zinc-800 text-white text-[11px] py-1 outline-none caret-white placeholder:text-zinc-700 font-mono"
      />
      {error && <span className="text-red-500 text-[10px]">{error}</span>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !email}
          className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
        >
          {sending ? "Sending..." : "Send link"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-zinc-700 hover:text-zinc-400 text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function LoginButton() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [view, setView] = useState<View>("login");
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

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

  if (view === "reset") {
    return (
      <ResetForm
        prefillEmail={lastEmail}
        onBack={() => setView("login")}
      />
    );
  }

  const handleSubmit = async (data: LoginFormValues) => {
    setLastEmail(data.email);
    setServerError("");
    try {
      setLoggingIn(true);
      const result = await dispatch(login(data)).unwrap();
      setShowForm(false);
      if (result.role === "superAdmin") {
        window.location.reload();
      } else if (result.username) {
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
        setView("login");
      }}
      onForgotPassword={(email) => {
        setLastEmail(email);
        setView("reset");
      }}
      serverError={serverError}
    />
  );
}
