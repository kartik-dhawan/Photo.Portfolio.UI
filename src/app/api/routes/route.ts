import { getNavItems, addNavItem } from "@/lib/navItems";

export async function GET() {
  try {
    const items = await getNavItems();
    return Response.json(items);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch routes";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const existing = await getNavItems();

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

    const id = await addNavItem(body);
    return Response.json({ id, ...body }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add route";
    return Response.json({ error: message }, { status: 500 });
  }
}
