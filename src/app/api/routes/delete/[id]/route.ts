import { getAdminDb } from "@/firebase/admin";
import { deleteNavItem } from "@/lib/navItems";
import { getSupabaseAdmin } from "@/supabase/admin";
import { verifyAuth } from "@/lib/auth";

const CONTENT_COLLECTION = "portfolio_content";
const ROUTES_COLLECTION = "portfolio_routes";
const BUCKET = "photo-portfolio";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = getAdminDb();

    // Get the route to find the slug and userId
    const routeDoc = await db.collection(ROUTES_COLLECTION).doc(id).get();
    const routeData = routeDoc.data();
    const route = routeData?.route as string | undefined;
    const slug = route?.replace(/^\//, "");
    const userId = routeData?.userId as string;

    if (slug && userId) {
      const contentDocId = `${userId}_${slug}`;
      // Delete all media from Supabase Storage for this route
      const supabase = getSupabaseAdmin();
      const storagePath = `${userId}/${slug}`;
      const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(storagePath);

      if (files?.length) {
        const paths = files.map((f) => `${storagePath}/${f.name}`);
        await supabase.storage.from(BUCKET).remove(paths);
      }

      // Delete the content document from Firestore
      await db.collection(CONTENT_COLLECTION).doc(contentDocId).delete();
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
