import { getUserByUsername } from "@/lib/users";
import { getProjectCardsForSection, getAllSections } from "@/lib/content";
import SectionPageView from "@/components/content/SectionPageView";

export const revalidate = 60;

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

interface PageProps {
  params: Promise<{ section: string }>;
}

export default async function SectionRoute({ params }: PageProps) {
  const { section } = await params;
  const user = await getUserByUsername(DEFAULT_USERNAME);
  if (!user) return null;

  const [sectionData, allSections] = await Promise.all([
    getProjectCardsForSection(user.uid, section),
    getAllSections(user.uid),
  ]);

  if (!sectionData) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-zinc-600 text-sm font-mono">Section not found</p>
      </div>
    );
  }

  const otherSections = allSections
    .filter((s) => s.slug !== section)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
    .map((s) => ({ name: s.name, href: `/sec/${s.slug}` }));

  return (
    <SectionPageView
      sectionName={sectionData.sectionName}
      projects={sectionData.projects}
      otherSections={otherSections}
    />
  );
}
