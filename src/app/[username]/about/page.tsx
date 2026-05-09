import { Metadata } from "next";
import { getUserByUsername } from "@/lib/users";
import { getAllBrands } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import AboutContent from "@/components/content/AboutContent";
import SocialLinksSection from "@/components/forms/social-links/SocialLinksSection";

export const revalidate = 60;

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

async function resolveUser(username: string) {
  const user = await getUserByUsername(username);
  if (user) return user;
  return getUserByUsername(DEFAULT_USERNAME);
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await resolveUser(username);
  if (!user) return { title: "About" };

  const settings = await getSettings(user.uid);
  const description = user.aboutText
    ? user.aboutText.slice(0, 160)
    : `About ${user.displayName}`;

  const images = settings.profilePhotoUrl
    ? [{ url: settings.profilePhotoUrl, width: 1200, height: 800, alt: user.displayName }]
    : undefined;

  return {
    title: "About",
    description,
    openGraph: {
      title: `About — ${user.displayName}`,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `About — ${user.displayName}`,
      description,
      images: settings.profilePhotoUrl ? [settings.profilePhotoUrl] : undefined,
    },
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { username } = await params;
  const user = await resolveUser(username);
  if (!user) return null;

  const [brands, settings] = await Promise.all([
    getAllBrands(user.uid),
    getSettings(user.uid),
  ]);

  const socialHandles = user.socialHandles ?? {};

  return (
    <div className="h-full min-h-[80vh] py-12 px-8">
      <AboutContent
        brands={brands}
        profilePhotoUrl={settings.profilePhotoUrl}
        aboutText={user.aboutText}
        socials={user.socials}
        userId={user.uid}
      />
      <SocialLinksSection
        userId={user.uid}
        defaultValues={{
          instagram: socialHandles.instagram ?? "",
          instagram_followers: socialHandles.instagram_followers ?? "",
          youtube: socialHandles.youtube ?? "",
          youtube_followers: socialHandles.youtube_followers ?? "",
          twitter: socialHandles.twitter ?? "",
          twitter_followers: socialHandles.twitter_followers ?? "",
          linkedin: socialHandles.linkedin ?? "",
          linkedin_followers: socialHandles.linkedin_followers ?? "",
          spotify: socialHandles.spotify ?? "",
          spotify_followers: socialHandles.spotify_followers ?? "",
        }}
      />
    </div>
  );
}
