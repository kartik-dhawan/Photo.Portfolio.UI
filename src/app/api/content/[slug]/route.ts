import { getPageContent, savePageContent } from "@/lib/content";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }
    const content = await getPageContent(userId, slug);
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
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const { blocks, brands, userId } = await request.json();
    const targetUserId = userId ?? authUser.uid;

    await savePageContent(targetUserId, slug, blocks, brands);
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to save content";
    return Response.json({ error: message }, { status: 500 });
  }
}
