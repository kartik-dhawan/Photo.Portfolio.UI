import { getAllBrands } from "@/lib/content";
import AboutContent from "@/components/content/AboutContent";

export const revalidate = 60;

export default async function AboutPage() {
  const brands = await getAllBrands();

  return (
    <div className="h-full min-h-[80vh] py-12 px-8">
      <AboutContent brands={brands} />
    </div>
  );
}
