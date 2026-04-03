import { getNavItems, addNavItem } from "@/lib/navItems";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }
    const items = await getNavItems(userId);
    return Response.json(items);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch routes";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = body.userId ?? authUser.uid;
    const existing = await getNavItems(userId);

    const duplicateRoute = existing.find((item) => item.route === body.route);
    if (duplicateRoute) {
      return Response.json(
        { error: `Route "${body.route}" already exists` },
        { status: 409 }
      );
    }

    const duplicateLabel = existing.find(
      (item) => item.label.toLowerCase() === body.label.toLowerCase()
    );
    if (duplicateLabel) {
      return Response.json(
        { error: `Label "${body.label}" already exists` },
        { status: 409 }
      );
    }

    const id = await addNavItem(userId, body);
    return Response.json({ id, ...body, userId }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add route";
    return Response.json({ error: message }, { status: 500 });
  }
}
