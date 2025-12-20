import { supabase } from "@/integrations/supabase/client";

export async function getLiveToken(liveId: string, role: "host" | "viewer") {
  const { data, error } = await supabase.functions.invoke("live-token", {
    body: { live_id: liveId, role },
  });

  if (error) {
    console.error("Erro ao chamar live-token:", error);
    throw new Error(error.message || "Erro ao obter token da live");
  }

  return data as { token: string; roomName: string; role: "host" | "viewer" };
}
