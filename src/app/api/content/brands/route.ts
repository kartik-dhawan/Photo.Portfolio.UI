import { getAllBrands } from "@/lib/content";

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }
    const brands = await getAllBrands(userId);
    return Response.json(brands);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch brands";
    return Response.json({ error: message }, { status: 500 });
  }
}
