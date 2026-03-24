import { getSupabaseAdmin } from '@/supabase/admin';

const BUCKET = 'photo-portfolio';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const slug = formData.get('slug') as string | null;

    if (!file || !slug) {
      return Response.json(
        { error: 'file and slug are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${slug}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

    return Response.json(
      { url: data.publicUrl, type: mediaType },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to upload file';
    return Response.json({ error: message }, { status: 500 });
  }
}
