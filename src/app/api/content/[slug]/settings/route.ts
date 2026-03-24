import { updatePageSettings } from "@/lib/content";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { brands, tags, filmedAt } = await request.json();
    await updatePageSettings(slug, { brands, tags, filmedAt: filmedAt ?? "" });
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update settings";
    return Response.json({ error: message }, { status: 500 });
  }
}
