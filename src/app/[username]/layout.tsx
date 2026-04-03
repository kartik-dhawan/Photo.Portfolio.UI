import { Metadata } from "next";
import { getUserByUsername } from "@/lib/users";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SocialLinks from "@/components/SocialLinks";
import TenantProvider from "@/components/TenantProvider";

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}

async function resolveUser(username: string) {
  // First try as a username
  const user = await getUserByUsername(username);
  if (user) return { user, isDefaultFallback: false };

  // Not a user — fall back to default user
  // This means the "username" segment is actually a slug (e.g. /portraits)
  const defaultUser = await getUserByUsername(DEFAULT_USERNAME);
  return { user: defaultUser, isDefaultFallback: true };
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { username } = await params;
  const { user } = await resolveUser(username);
  if (!user) return { title: "Not Found" };

  return {
    title: {
      default: user.displayName,
      template: `%s — ${user.displayName}`,
    },
    description: `Photography and videography portfolio by ${user.displayName}`,
    keywords: ["photography", "videography", "portfolio", user.displayName],
    authors: [{ name: user.displayName }],
    creator: user.displayName,
    openGraph: {
      type: "website",
      siteName: user.displayName,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function UsernameLayout({ children, params }: LayoutProps) {
  const { username } = await params;
  const { user } = await resolveUser(username);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-600 text-sm font-mono">Not found</p>
      </div>
    );
  }

  return (
    <TenantProvider userId={user.uid} username={user.username} displayName={user.displayName} tagline={user.tagline}>
      <MobileNav displayName={user.displayName} />
      <div className="flex min-h-screen">
        <aside className="hidden md:flex flex-col w-64 shrink-0 px-8 pt-12 pb-8 sticky top-0 h-screen overflow-y-auto border-r border-zinc-800/50">
          <Sidebar />
        </aside>
        <main className="flex-1 md:pt-0 pt-14">
          {children}
        </main>
      </div>
      <SocialLinks />
    </TenantProvider>
  );
}
