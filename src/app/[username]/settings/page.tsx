import { getUserByUsername } from "@/lib/users";
import UserSettingsForm from "@/components/forms/user-settings/UserSettingsForm";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return null;

  return (
    <div className="min-h-[80vh] py-12 px-3 md:px-6 xl:px-24">
      <h1 className="text-white text-2xl font-mono uppercase tracking-wider mb-8">
        Settings
      </h1>
      <UserSettingsForm
        userId={user.uid}
        defaultValues={{
          displayName: user.displayName,
          tagline: user.tagline,
          heroTitle: user.heroTitle,
          heroSubtitle: user.heroSubtitle,
          aboutText: user.aboutText,
          customDomain: user.customDomain,
        }}
      />
    </div>
  );
}
