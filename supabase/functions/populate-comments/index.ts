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

  // Shuffle and pick unique comments
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

    // 1. Buscar publicações com fotos que não têm comentários
    const { data: publicacoes, error: pubError } = await supabase
      .from("publicacoes")
      .select(`
        id,
        user_id,
        midia_url,
        tipo_midia,
        comentarios_count
      `)
      .not("midia_url", "is", null)
      .or("tipo_midia.eq.imagem,tipo_midia.is.null")
      .eq("comentarios_count", 0)
      .limit(50);

    if (pubError) {
      throw new Error(`Erro ao buscar publicações: ${pubError.message}`);
    }

    if (!publicacoes || publicacoes.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhuma publicação elegível encontrada", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Buscar todos os perfis reais para usar como comentaristas
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, gender, display_name")
      .not("gender", "is", null)
      .limit(100);

    if (profilesError) {
      throw new Error(`Erro ao buscar perfis: ${profilesError.message}`);
    }

    if (!profiles || profiles.length < 5) {
      return new Response(
        JSON.stringify({ message: "Poucos perfis disponíveis para comentar", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Separar perfis por gênero
    const perfisMasculinos = profiles.filter(p => p.gender === "masculino");
    const perfisFemininos = profiles.filter(p => !["masculino"].includes(p.gender || ""));

    // 4. Para cada publicação, gerar comentários
    let totalComentarios = 0;
    const comentariosParaInserir: Array<{
      publicacao_id: string;
      user_id: string;
      comentario: string;
    }> = [];

    for (const pub of publicacoes) {
      // Buscar o gênero do dono da publicação
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("gender")
        .eq("user_id", pub.user_id)
        .single();

      const ownerGender = ownerProfile?.gender || "feminino";
      
      // Gerar entre 1 e 5 comentários
      const numComentarios = Math.floor(Math.random() * 5) + 1;
      
      // Selecionar comentaristas aleatórios (não pode ser o dono da publicação)
      const potentialCommenters = profiles.filter(p => p.user_id !== pub.user_id);
      const shuffledCommenters = [...potentialCommenters].sort(() => Math.random() - 0.5);
      const selectedCommenters = shuffledCommenters.slice(0, numComentarios);

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
        }
      }
    }

    // 5. Inserir todos os comentários
    if (comentariosParaInserir.length > 0) {
      const { error: insertError } = await supabase
        .from("comentarios_publicacoes")
        .insert(comentariosParaInserir);

      if (insertError) {
        throw new Error(`Erro ao inserir comentários: ${insertError.message}`);
      }
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
