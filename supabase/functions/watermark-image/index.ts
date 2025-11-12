import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image, Font, Color } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

// Helper to draw a centered semi-transparent text watermark
async function applyTextWatermark(base: Image, text: string) {
  const font = await Font.fromTTF(
    await (await fetch("https://deno.land/x/imagescript@1.3.0/fonts/OpenSans/OpenSans-Bold.ttf")).arrayBuffer(),
    64,
  );

  const wm = Image.renderText(font, text, Color.rgba(255, 255, 255, 180));

  // Scale watermark if it's too large
  const targetWidth = Math.min(base.width * 0.7, wm.width);
  const scale = targetWidth / wm.width;
  const wmResized = wm.resize(targetWidth, Math.round(wm.height * scale));

  // Add subtle background shadow to improve readability
  const shadow = wmResized.clone();
  shadow.fill(Color.rgba(0, 0, 0, 100));

  const x = Math.round((base.width - wmResized.width) / 2);
  const y = Math.round((base.height - wmResized.height) / 2);

  base.composite(shadow, x + 2, y + 2);
  base.composite(wmResized, x, y);

  return base;
}

function ensureEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} not set`);
  return v;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const { bucket, path, targetBucket, watermarkText } = await req.json();
    if (!bucket || !path) {
      return new Response(JSON.stringify({ error: "bucket and path are required" }), { status: 400 });
    }

    const SUPABASE_URL = ensureEnv("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = ensureEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Download original (private) file
    const { data: fileData, error: dlErr } = await supabase.storage.from(bucket).download(path);
    if (dlErr || !fileData) {
      return new Response(JSON.stringify({ error: dlErr?.message || "Failed to download original" }), { status: 400 });
    }

    const bytes = new Uint8Array(await fileData.arrayBuffer());
    let img: Image;
    try {
      img = await Image.decode(bytes);
    } catch (_e) {
      return new Response(JSON.stringify({ error: "Unsupported image format" }), { status: 400 });
    }

    // Resize very large images for performance (longest side to ~1600px)
    const MAX_SIDE = 1600;
    if (Math.max(img.width, img.height) > MAX_SIDE) {
      if (img.width >= img.height) {
        img = img.resize(MAX_SIDE, Math.round((img.height / img.width) * MAX_SIDE));
      } else {
        img = img.resize(Math.round((img.width / img.height) * MAX_SIDE), MAX_SIDE);
      }
    }

    // Apply watermark
    const text = watermarkText || "Sensual Nexus";
    await applyTextWatermark(img, text);

    // Encode to WebP for size/perf (fallback to JPEG if needed)
    let encoded: Uint8Array;
    let contentType = "image/webp";
    try {
      encoded = await img.encodeWebp(80);
    } catch (_e) {
      encoded = await img.encodeJPEG(82);
      contentType = "image/jpeg";
    }

    const outBucket = targetBucket || "watermarked-photos";
    const outPath = path.replace(/^uploads\/?/, "");
    const destPath = `watermarked/${outPath}`.replace(/\/+/, "/");

    const { error: upErr } = await supabase.storage.from(outBucket).upload(destPath, encoded, {
      contentType,
      upsert: true,
    });
    if (upErr) {
      return new Response(JSON.stringify({ error: upErr.message || "Failed to upload watermarked" }), { status: 500 });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        bucket: outBucket,
        path: destPath,
        contentType,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500 });
  }
});
