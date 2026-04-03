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

    const { username, displayName, tagline, email, password } =
      await request.json();

    if (!username || !email || !password) {
      return Response.json(
        { error: "username, email, and password are required" },
        { status: 400 }
      );
    }

    // Create Firebase Auth user
    const { getAuth } = await import("firebase-admin/auth");
    const firebaseUser = await getAuth().createUser({
      email,
      password,
      displayName: displayName ?? username,
    });

    const user = await createUser({
      uid: firebaseUser.uid,
      username,
      displayName: displayName ?? username,
      tagline: tagline ?? "",
      email,
      role: "admin",
    });

    return Response.json(user, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    return Response.json({ error: message }, { status: 500 });
  }
}
