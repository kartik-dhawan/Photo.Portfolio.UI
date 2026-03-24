import { getSupabaseAdmin } from "@/supabase/admin";

const BUCKET = "photo-portfolio";

export async function POST(request: Request) {
  try {
    const { urls } = (await request.json()) as { urls: string[] };
    if (!urls?.length) {
      return Response.json({ error: "urls required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const paths = urls
      .map((url) => {
        const match = url.match(/\/object\/public\/[^/]+\/(.+)$/);
        return match?.[1] ?? null;
      })
      .filter(Boolean) as string[];

    if (paths.length) {
      const { error } = await supabase.storage.from(BUCKET).remove(paths);
      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to delete media";
    return Response.json({ error: message }, { status: 500 });
  }
}
