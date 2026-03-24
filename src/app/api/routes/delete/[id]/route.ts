import { getAdminDb } from "@/firebase/admin";
import { deleteNavItem } from "@/lib/navItems";
import { getSupabaseAdmin } from "@/supabase/admin";

const CONTENT_COLLECTION = "portfolio_content";
const ROUTES_COLLECTION = "portfolio_routes";
const BUCKET = "photo-portfolio";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();

    // Get the route to find the slug
    const routeDoc = await db.collection(ROUTES_COLLECTION).doc(id).get();
    const route = routeDoc.data()?.route as string | undefined;
    const slug = route?.replace(/^\//, "");

    if (slug) {
      // Delete all media from Supabase Storage for this route
      const supabase = getSupabaseAdmin();
      const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(slug);

      if (files?.length) {
        const paths = files.map((f) => `${slug}/${f.name}`);
        await supabase.storage.from(BUCKET).remove(paths);
      }

      // Delete the content document from Firestore
      await db.collection(CONTENT_COLLECTION).doc(slug).delete();
    }

    // Delete the nav item
    await deleteNavItem(id);

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to delete route";
    return Response.json({ error: message }, { status: 500 });
  }
}
