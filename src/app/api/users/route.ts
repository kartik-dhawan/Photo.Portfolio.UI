import { verifyAuth } from "@/lib/auth";
import { createUser, getAllUsers } from "@/lib/users";

export async function GET(request: Request) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser || authUser.role !== "superAdmin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const users = await getAllUsers();
    return Response.json(users);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch users";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser || authUser.role !== "superAdmin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { uid, username, displayName, tagline, email, role } =
      await request.json();

    if (!uid || !username || !email) {
      return Response.json(
        { error: "uid, username, and email are required" },
        { status: 400 }
      );
    }

    const user = await createUser({
      uid,
      username,
      displayName: displayName ?? username,
      tagline: tagline ?? "",
      email,
      role: role ?? "admin",
    });

    return Response.json(user, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    return Response.json({ error: message }, { status: 500 });
  }
}
