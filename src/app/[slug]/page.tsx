import PageContent from "@/components/content/PageContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="h-full min-h-[80vh] py-12 px-8">
      <PageContent slug={slug} />
    </div>
  );
}
