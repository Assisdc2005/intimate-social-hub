import { supabase } from "@/integrations/supabase/client";

const PRIVATE_BUCKET = "private-photos"; // make this bucket private
const PUBLIC_WATERMARK_BUCKET = "watermarked-photos"; // can be public

export type WatermarkResult = {
  bucket: string;
  path: string;
  publicUrl: string;
  contentType: string;
};

function sanitizePath(p: string) {
  return p.replace(/\\/g, "/").replace(/^\/+/, "");
}

export async function uploadOriginalAndGenerateWatermark(opts: {
  file: File;
  userId: string;
  watermarkText?: string;
}): Promise<{ error?: string; data?: WatermarkResult }> {
  try {
    const { file, userId, watermarkText } = opts;

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const base = file.name.replace(/\.[^.]+$/, "");
    const ts = Date.now();
    const originalPath = sanitizePath(`uploads/${userId}/${base}-${ts}.${ext}`);

    // 1) Upload original to private bucket
    const { error: upErr } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .upload(originalPath, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (upErr) return { error: upErr.message };

    // 2) Invoke edge function to create a watermarked copy in public bucket
    const { data, error } = await supabase.functions.invoke("watermark-image", {
      body: {
        bucket: PRIVATE_BUCKET,
        path: originalPath,
        targetBucket: PUBLIC_WATERMARK_BUCKET,
        watermarkText: watermarkText || undefined,
      },
    });
    if (error) return { error: (error as any).message || "Failed to watermark" };

    const outBucket = data.bucket as string;
    const outPath = data.path as string;

    // 3) Get a public URL for the watermarked asset
    const { data: pub } = supabase.storage.from(outBucket).getPublicUrl(outPath);

    return {
      data: {
        bucket: outBucket,
        path: outPath,
        publicUrl: pub.publicUrl,
        contentType: data.contentType as string,
      },
    };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

export function getWatermarkedPublicUrl(path: string) {
  const normalized = sanitizePath(path);
  const { data } = supabase.storage.from(PUBLIC_WATERMARK_BUCKET).getPublicUrl(normalized);
  return data.publicUrl;
}
