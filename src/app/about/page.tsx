import { Metadata } from "next";
import { getAllBrands } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import AboutContent from "@/components/content/AboutContent";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const description = "I'm Kartik Dhawan — a photographer and videographer based in India. Specializing in portraits, brand storytelling, and cinematic video work.";

  const images = settings.profilePhotoUrl
    ? [{ url: settings.profilePhotoUrl, width: 1200, height: 800, alt: "Kartik Dhawan" }]
    : undefined;

  return {
    title: "About",
    description,
    openGraph: {
      title: "About — Kartik Dhawan",
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: "About — Kartik Dhawan",
      description,
      images: settings.profilePhotoUrl ? [settings.profilePhotoUrl] : undefined,
    },
  };
}

export default async function AboutPage() {
  const [brands, settings] = await Promise.all([
    getAllBrands(),
    getSettings(),
  ]);

  return (
    <div className="h-full min-h-[80vh] py-12 px-8">
      <AboutContent brands={brands} profilePhotoUrl={settings.profilePhotoUrl} />
    </div>
  );
}
