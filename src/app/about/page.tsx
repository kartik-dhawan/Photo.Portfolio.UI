import { getAllBrands } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import AboutContent from "@/components/content/AboutContent";

export const revalidate = 60;

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
