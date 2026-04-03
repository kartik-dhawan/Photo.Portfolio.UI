"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";
import { getAuthToken } from "@/store/auth/slice";
import { useModal } from "@/components/common/useModal";
import { UserProfile } from "@/lib/types";

export default function UserManagement() {
  const { role } = useAppSelector((s) => s.auth);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModal, renderCreateModal] = useModal({ title: "Create User" });

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
    tagline: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const isSuperAdmin = role === "superAdmin";

  const fetchUsers = async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchUsers();
  }, [isSuperAdmin]);

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const token = getAuthToken();
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to create user");
      }
      setForm({ username: "", email: "", password: "", displayName: "", tagline: "" });
      createModal.close();
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  if (!isSuperAdmin) return null;

  const inputClass =
    "bg-transparent border border-zinc-800 rounded px-3 py-2 text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700 w-full";

  return (
    <>
      <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
        <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-mono">
          Users ({users.length})
        </span>
        {loading && <span className="text-zinc-700 text-xs font-mono">Loading...</span>}
        {users.map((u) => (
          <a
            key={u.uid}
            href={`/${u.username}`}
            className="text-zinc-400 hover:text-white text-xs font-mono transition-colors flex items-center gap-2"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${u.role === "superAdmin" ? "bg-amber-500" : "bg-zinc-600"}`} />
            {u.username}
          </a>
        ))}
        <button
          onClick={() => createModal.open()}
          className="text-zinc-600 hover:text-zinc-300 text-[10px] uppercase tracking-wider transition-colors cursor-pointer text-left mt-1"
        >
          + Invite User
        </button>
      </div>

      {renderCreateModal(
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className={inputClass}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Display Name (optional)"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Tagline (optional)"
            value={form.tagline}
            onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            className={inputClass}
          />
          {error && <span className="text-red-500 text-[10px]">{error}</span>}
        </div>,
        {
          size: "sm",
          cancelButtonProps: {
            label: "Cancel",
            onClick: () => createModal.close(),
          },
          okButtonProps: {
            label: creating ? "Creating..." : "Create",
            disabled: creating || !form.username || !form.email || !form.password,
            onClick: handleCreate,
          },
        }
      )}
    </>
  );
}
