import { getAllMedia } from "@/lib/content";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(20, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
    const result = await getAllMedia(page, pageSize);
    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch collections";
    return Response.json({ error: message }, { status: 500 });
  }
}
