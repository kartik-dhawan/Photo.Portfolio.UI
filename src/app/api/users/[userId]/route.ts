import { verifyAuth, canEdit } from "@/lib/auth";
import { getUserByUid, updateUser } from "@/lib/users";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const user = await getUserByUid(userId);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch user";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    if (!canEdit(authUser, userId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    // Don't allow changing uid, username, or role via this endpoint
    delete data.uid;
    delete data.username;
    delete data.role;
    delete data.createdAt;
    // Only superAdmin can toggle customDomainEnabled
    if (authUser.role !== "superAdmin") {
      delete data.customDomainEnabled;
    }
    // Map boolean to customDomain field
    if (data.customDomainEnabled !== undefined) {
      data.customDomain = data.customDomainEnabled ? "pending" : null;
      delete data.customDomainEnabled;
    }

    await updateUser(userId, data);
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user";
    return Response.json({ error: message }, { status: 500 });
  }
}
