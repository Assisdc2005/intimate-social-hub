import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { create, type JWTPayload, type SignOptions } from "https://deno.land/x/djwt@v2.9/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_API_KEY_SID = Deno.env.get("TWILIO_API_KEY_SID");
const TWILIO_API_KEY_SECRET = Deno.env.get("TWILIO_API_KEY_SECRET");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function createTwilioToken(payload: JWTPayload): Promise<string> {
  if (!TWILIO_API_KEY_SECRET) {
    throw new Error("TWILIO_API_KEY_SECRET não configurado nas variáveis de ambiente");
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(TWILIO_API_KEY_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // Header explícito com algoritmo HS256
  const header = { alg: "HS256", typ: "JWT" } as JWTPayload;

  // djwt.create(header, payload, key)
  return await create(header, payload, key as any);
}

Deno.serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
    return new Response("Twilio env vars not configured", { status: 500, headers: corsHeaders });
  }

  // Recupera o usuário autenticado via Supabase client
  const authHeader = req.headers.get("authorization") ?? "";
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    console.error("Erro ao obter usuário autenticado na live-token:", userError);
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const userId = user.id;

  const body = (await req.json().catch(() => null)) as
    | { live_id?: string; role?: "host" | "viewer" }
    | null;

  const liveId = body?.live_id;
  const role = body?.role || "viewer";

  if (!liveId) {
    return new Response(JSON.stringify({ error: "live_id obrigatório" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = 60 * 60; // 1h

  const payload: JWTPayload = {
    iss: TWILIO_API_KEY_SID,
    sub: TWILIO_ACCOUNT_SID,
    iat: now,
    exp: now + ttl,
    grants: {
      identity: userId,
      video: {
        room: liveId,
      },
    },
  } as any;

  try {
    const token = await createTwilioToken(payload);

    return new Response(
      JSON.stringify({ token, roomName: liveId, role }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (e) {
    console.error("Erro ao gerar token Twilio:", e);
    return new Response(
      JSON.stringify({
        error: "Erro ao gerar token Twilio",
        details: (e as any)?.message ?? String(e),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
