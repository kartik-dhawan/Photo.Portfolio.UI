import { getUserByUsername } from "@/lib/users";
import { getProjectCardsForSection } from "@/lib/content";
import SectionPageView from "@/components/content/SectionPageView";

export const revalidate = 60;

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

interface PageProps {
  params: Promise<{ username: string; section: string }>;
}

async function resolveUser(username: string) {
  const user = await getUserByUsername(username);
  if (user) return user;
  return getUserByUsername(DEFAULT_USERNAME);
}

export default async function SectionRoute({ params }: PageProps) {
  const { username, section } = await params;
  const user = await resolveUser(username);
  if (!user) return null;

  const sectionData = await getProjectCardsForSection(user.uid, section);

  if (!sectionData) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-zinc-600 text-sm font-mono">Section not found</p>
      </div>
    );
  }

  return (
    <SectionPageView
      sectionName={sectionData.sectionName}
      projects={sectionData.projects}
    />
  );
}
