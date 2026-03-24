import { updateNavItem } from "@/lib/navItems";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    await updateNavItem(id, data);
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update route";
    return Response.json({ error: message }, { status: 500 });
  }
}
