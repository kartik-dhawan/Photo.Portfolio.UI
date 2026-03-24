import { getAllBrands } from "@/lib/content";

export async function GET() {
  try {
    const brands = await getAllBrands();
    return Response.json(brands);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch brands";
    return Response.json({ error: message }, { status: 500 });
  }
}
