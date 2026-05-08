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

    if (!file || !slug || !userId) {
      return Response.json(
        { error: "file, slug, and userId are required" },
        { status: 400 }
      );
    }

    // Generate path for the file
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${slug}/${Date.now()}.${ext}`;

    // Upload using storage manager (server-side)
    const result = await storageManager.upload(path, file);
    
    // Sync to backup provider
    await storageManager.syncToBackup(path, file);

    return Response.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to upload file";
    return Response.json({ error: message }, { status: 500 });
  }
}
