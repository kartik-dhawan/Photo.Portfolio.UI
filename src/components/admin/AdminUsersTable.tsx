"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { getAuthToken } from "@/store/auth/slice";
import { useModal } from "@/components/common/useModal";
import { UserProfile } from "@/lib/types";
import UserSettingsForm from "@/components/forms/user-settings/UserSettingsForm";

interface Props {
  initialUsers: UserProfile[];
}

export default function AdminUsersTable({ initialUsers }: Props) {
  const { role } = useAppSelector((s) => s.auth);
  const [users, setUsers] = useState(initialUsers);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editModal, renderEditModal] = useModal({ title: "Edit User" });

  // Invite form
  const [inviteModal, renderInviteModal] = useModal({ title: "Invite User" });
  const [form, setForm] = useState({ username: "", email: "", password: "", displayName: "", tagline: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  if (role !== "superAdmin") {
    return <p className="text-zinc-600 text-sm font-mono">Access denied</p>;
  }

  const handleInvite = async () => {
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
        throw new Error(body.error);
      }
      const newUser = await res.json();
      setUsers((prev) => [...prev, newUser]);
      setForm({ username: "", email: "", password: "", displayName: "", tagline: "" });
      inviteModal.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  };

  const inputClass =
    "bg-transparent border border-zinc-800 rounded px-3 py-2 text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700 w-full";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-xs font-mono">{users.length} users</span>
        <button
          onClick={() => inviteModal.open()}
          className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 rounded px-3 py-1.5 transition-colors cursor-pointer"
        >
          + Invite User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="py-3 pr-4 text-[10px] uppercase tracking-wider text-zinc-600 font-normal">Username</th>
              <th className="py-3 pr-4 text-[10px] uppercase tracking-wider text-zinc-600 font-normal">Display Name</th>
              <th className="py-3 pr-4 text-[10px] uppercase tracking-wider text-zinc-600 font-normal">Email</th>
              <th className="py-3 pr-4 text-[10px] uppercase tracking-wider text-zinc-600 font-normal">Role</th>
              <th className="py-3 pr-4 text-[10px] uppercase tracking-wider text-zinc-600 font-normal">Custom Domain</th>
              <th className="py-3 text-[10px] uppercase tracking-wider text-zinc-600 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className="border-b border-zinc-800/50">
                <td className="py-3 pr-4">
                  <Link href={`/${u.username}`} className="text-zinc-300 hover:text-white underline underline-offset-2">
                    {u.username}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-zinc-400">{u.displayName}</td>
                <td className="py-3 pr-4 text-zinc-500">{u.email}</td>
                <td className="py-3 pr-4">
                  <span className={`text-[10px] uppercase tracking-wider ${u.role === "superAdmin" ? "text-amber-500" : "text-zinc-500"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 pr-4 text-zinc-500">{u.customDomain ? "Yes" : "No"}</td>
                <td className="py-3">
                  <button
                    onClick={() => {
                      setEditUser(u);
                      editModal.open();
                    }}
                    className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {renderEditModal(
        editUser && (
          <UserSettingsForm
            userId={editUser.uid}
            targetRole={editUser.role}
            defaultValues={{
              displayName: editUser.displayName,
              tagline: editUser.tagline,
              heroTitle: editUser.heroTitle,
              heroSubtitle: editUser.heroSubtitle,
              aboutText: editUser.aboutText,
              themeId: editUser.themeId ?? "black",
              customDomainEnabled: !!editUser.customDomain,
            }}
            onSaved={() => {
              editModal.close();
              window.location.reload();
            }}
          />
        ),
        { size: "md" }
      )}

      {renderInviteModal(
        <div className="flex flex-col gap-4">
          <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className={inputClass} />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={inputClass} />
          <input type="text" placeholder="Display Name" value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} className={inputClass} />
          <input type="text" placeholder="Tagline" value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} className={inputClass} />
          {error && <span className="text-red-500 text-[10px]">{error}</span>}
        </div>,
        {
          size: "sm",
          cancelButtonProps: { label: "Cancel", onClick: () => inviteModal.close() },
          okButtonProps: {
            label: creating ? "Creating..." : "Create",
            disabled: creating || !form.username || !form.email || !form.password,
            onClick: handleInvite,
          },
        }
      )}
    </div>
  );
}
