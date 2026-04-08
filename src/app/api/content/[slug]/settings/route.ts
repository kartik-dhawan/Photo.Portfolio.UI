import { updatePageSettings } from "@/lib/content";
import { verifyAuth } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const { brands, tags, filmedAt, sectionNames, userId } = await request.json();
    const targetUserId = userId ?? authUser.uid;

    await updatePageSettings(targetUserId, slug, { brands, tags, filmedAt: filmedAt ?? "", sectionNames });
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update settings";
    return Response.json({ error: message }, { status: 500 });
  }
}
