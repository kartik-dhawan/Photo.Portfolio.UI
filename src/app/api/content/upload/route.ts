import { verifyAuth } from "@/lib/auth";
import { storageManager } from "@/lib/storage-manager";

export async function POST(request: Request) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;
    const userId = formData.get('userId') as string;

    if (!file || !slug) {
      return Response.json(
        { error: "file and slug are required" },
        { status: 400 }
      );
    }

    // Use provided userId (for superAdmin acting on behalf) or auth user's uid
    const targetUserId = userId ?? authUser.uid;

    const ext = file.name.split(".").pop() || "bin";
    const path = `${targetUserId}/${slug}/${Date.now()}.${ext}`;

    // Use storage manager for unified upload (Cloudinary or Supabase)
    const result = await storageManager.upload(path, file);

    return Response.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to upload file";
    return Response.json({ error: message }, { status: 500 });
  }
}
