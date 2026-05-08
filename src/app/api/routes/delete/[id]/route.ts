import { getAdminDb } from "@/firebase/admin";
import { deleteNavItem } from "@/lib/navItems";
import { getSupabaseAdmin } from "@/supabase/admin";
import { verifyAuth } from "@/lib/auth";
import { storageManager } from "@/lib/storage-manager";
import { isCloudinaryActive, isSupabaseActive } from "@/lib/storage-config";

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
      const storagePath = `${userId}/${slug}`;

      // Delete media using storage manager (works for both providers)
      try {
        if (isSupabaseActive()) {
          // For Supabase, list files first
          const supabase = getSupabaseAdmin();
          const { data: files } = await supabase.storage
            .from(BUCKET)
            .list(storagePath);

          if (files?.length) {
            const paths = files.map((f) => `${storagePath}/${f.name}`);
            await storageManager.delete(paths);
          }
        } else if (isCloudinaryActive()) {
          // For Cloudinary, we need to find all files in the folder
          // This is a simplified approach - in production you might want to
          // track media paths in your database for more efficient deletion
          console.log(`Would delete all files in ${storagePath} from Cloudinary`);
          // Note: Cloudinary doesn't have a simple "list folder" API like Supabase
          // You might need to maintain a list of files in your database
        }
      } catch (error) {
        console.error('Storage deletion error:', error);
        // Continue with deletion even if storage cleanup fails
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
