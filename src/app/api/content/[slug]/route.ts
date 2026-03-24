import { getPageContent, savePageContent } from "@/lib/content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const content = await getPageContent(slug);
    return Response.json(content ?? { slug, blocks: [] });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch content";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { blocks, brands } = await request.json();
    await savePageContent(slug, blocks, brands);
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to save content";
    return Response.json({ error: message }, { status: 500 });
  }
}
