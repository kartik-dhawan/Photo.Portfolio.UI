"use client";

import { useAppSelector } from "@/store";
import SocialLinksForm from "./SocialLinksForm";
import { SocialLinksFormValues } from "./schema";

interface Props {
  userId: string;
  defaultValues: SocialLinksFormValues;
}

export default function SocialLinksSection({ userId, defaultValues }: Props) {
  const { isAuthenticated, uid, role } = useAppSelector((s) => s.auth);
  const canEdit = isAuthenticated && (role === "superAdmin" || uid === userId);

  if (!canEdit) return null;

  return (
    <div className="px-6 xl:px-24 py-12 border-t border-zinc-800 mt-12">
      <SocialLinksForm userId={userId} defaultValues={defaultValues} />
    </div>
  );
}
