import { getAdminDb } from "@/firebase/admin";
import { deleteNavItem } from "@/lib/navItems";
import { verifyAuth } from "@/lib/auth";
import { storageManager } from "@/lib/storage-manager";
import { v2 as cloudinary } from 'cloudinary';

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

      // Delete media from Cloudinary folder
      try {
        // Use Cloudinary's delete by prefix API to delete all files in folder
        const prefix = `${BUCKET}/${storagePath}`;
        const result = await cloudinary.api.delete_resources_by_prefix(prefix);

        console.log(`Deleted files from Cloudinary folder ${prefix}:`, result);
      } catch (error) {
        console.error('Cloudinary folder deletion error:', error);
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
