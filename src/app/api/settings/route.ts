import { getSettings, updateSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json(settings);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch settings";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    await updateSettings(data);
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return Response.json({ error: message }, { status: 500 });
  }
}
