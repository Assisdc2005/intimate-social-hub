import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@^2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comentários variados por categoria
const comentariosMasculinoParaMasculino = [
  "Brabo demais 🔥",
  "Mandou bem!",
  "Estilo top",
  "Show de bola",
  "Fera demais",
  "Esse é o cara",
  "Mandando bem sempre",
  "Top demais mano",
  "Arrasou brother",
  "Muito bom!",
];

const comentariosMasculinoParaFeminino = [
  "Muito linda 🔥",
  "Chamou minha atenção",
  "Que foto incrível",
  "Difícil não comentar",
  "Muito charme 😍",
  "Que energia boa",
  "Linda demais",
  "Arrasou nessa",
  "Curti demais essa foto",
  "Que presença",
  "Bora se conhecer melhor?",
  "Podemos marcar algo? 😉",
  "Que vibe boa",
  "Foto que pede conversa",
  "Muito estilo",
];

const comentariosFemininoParaMasculino = [
  "Muito charmoso 🔥",
  "Curti o estilo",
  "Que presença",
  "Interessante 😏",
  "Gostei do que vi",
  "Chamou atenção",
  "Bora conversar? 😉",
  "Muito atraente",
  "Que energia",
  "Foto boa demais",
  "Estilo que agrada",
  "Difícil ignorar",
  "Mandou bem nessa",
  "Curti demais",
  "Que vibe boa",
];

const comentariosFemininoParaFeminino = [
  "Linda demais 😍",
  "Arrasou amiga",
  "Muito estilo",
  "Que foto linda",
  "Maravilhosa",
  "Arrasando sempre",
  "Belíssima",
  "Que energia boa",
  "Muito linda",
  "Foto perfeita",
  "Inspiração",
  "Que charme",
  "Lindíssima",
  "Amei essa foto",
  "Perfeita demais",
];

function getRandomComments(
  autorGender: string,
  publicacaoOwnerGender: string,
  count: number
): string[] {
  let pool: string[];

  const isMasculino = autorGender === "masculino";
  const ownerIsMasculino = publicacaoOwnerGender === "masculino";

  if (isMasculino && ownerIsMasculino) {
    pool = comentariosMasculinoParaMasculino;
  } else if (isMasculino && !ownerIsMasculino) {
    pool = comentariosMasculinoParaFeminino;
  } else if (!isMasculino && ownerIsMasculino) {
    pool = comentariosFemininoParaMasculino;
  } else {
    pool = comentariosFemininoParaFeminino;
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Iniciando população de comentários...");

    // 1. Buscar TODAS as publicações que não têm comentários (com ou sem mídia)
    const { data: publicacoes, error: pubError } = await supabase
      .from("publicacoes")
      .select(`id, user_id, midia_url, tipo_midia, comentarios_count`)
      .eq("comentarios_count", 0)
      .limit(200);

    if (pubError) {
      console.error("Erro ao buscar publicações:", pubError);
      throw new Error(`Erro ao buscar publicações: ${pubError.message}`);
    }

    console.log(`Publicações encontradas: ${publicacoes?.length || 0}`);

    if (!publicacoes || publicacoes.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhuma publicação elegível encontrada", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Buscar todos os perfis reais
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, gender, display_name")
      .not("gender", "is", null)
      .limit(100);

    if (profilesError) {
      console.error("Erro ao buscar perfis:", profilesError);
      throw new Error(`Erro ao buscar perfis: ${profilesError.message}`);
    }

    console.log(`Perfis encontrados: ${profiles?.length || 0}`);

    if (!profiles || profiles.length < 5) {
      return new Response(
        JSON.stringify({ message: "Poucos perfis disponíveis para comentar", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Para cada publicação, gerar comentários
    let totalComentarios = 0;
    const comentariosParaInserir: Array<{
      publicacao_id: string;
      user_id: string;
      comentario: string;
    }> = [];

    const comentariosPorPublicacao: Record<string, number> = {};

    for (const pub of publicacoes) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("gender")
        .eq("user_id", pub.user_id)
        .single();

      const ownerGender = ownerProfile?.gender || "feminino";
      const numComentarios = Math.floor(Math.random() * 5) + 1;
      
      const potentialCommenters = profiles.filter(p => p.user_id !== pub.user_id);
      const shuffledCommenters = [...potentialCommenters].sort(() => Math.random() - 0.5);
      const selectedCommenters = shuffledCommenters.slice(0, numComentarios);

      comentariosPorPublicacao[pub.id] = 0;

      for (const commenter of selectedCommenters) {
        const commenterGender = commenter.gender || "feminino";
        const comments = getRandomComments(commenterGender, ownerGender, 1);
        
        if (comments.length > 0) {
          comentariosParaInserir.push({
            publicacao_id: pub.id,
            user_id: commenter.user_id,
            comentario: comments[0],
          });
          totalComentarios++;
          comentariosPorPublicacao[pub.id]++;
        }
      }
    }

    console.log(`Comentários a inserir: ${comentariosParaInserir.length}`);

    // 4. Inserir todos os comentários
    if (comentariosParaInserir.length > 0) {
      const { error: insertError } = await supabase
        .from("comentarios_publicacoes")
        .insert(comentariosParaInserir);

      if (insertError) {
        console.error("Erro ao inserir comentários:", insertError);
        throw new Error(`Erro ao inserir comentários: ${insertError.message}`);
      }

      console.log("Comentários inseridos com sucesso!");

      // 5. Atualizar os contadores de comentários nas publicações
      for (const [pubId, count] of Object.entries(comentariosPorPublicacao)) {
        if (count > 0) {
          const { error: updateError } = await supabase
            .from("publicacoes")
            .update({ comentarios_count: count })
            .eq("id", pubId);

          if (updateError) {
            console.error(`Erro ao atualizar contador da publicação ${pubId}:`, updateError);
          }
        }
      }

      console.log("Contadores atualizados!");
    }

    return new Response(
      JSON.stringify({
        message: "Comentários populados com sucesso",
        publicacoesProcessadas: publicacoes.length,
        totalComentarios,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
