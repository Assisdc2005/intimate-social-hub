
-- Criar tabela de publicações
CREATE TABLE public.publicacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  midia_url TEXT,
  tipo_midia TEXT CHECK (tipo_midia IN ('imagem', 'video', 'texto')) DEFAULT 'texto',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de curtidas
CREATE TABLE public.curtidas_publicacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacao_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(publicacao_id, user_id) -- Evita curtidas duplicadas
);

-- Criar tabela de comentários
CREATE TABLE public.comentarios_publicacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacao_id UUID NOT NULL,
  user_id UUID NOT NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (Row Level Security) para as tabelas
ALTER TABLE public.publicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curtidas_publicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios_publicacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para publicações
CREATE POLICY "Qualquer usuário logado pode ver publicações" 
  ON public.publicacoes 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem criar suas próprias publicações" 
  ON public.publicacoes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar suas próprias publicações" 
  ON public.publicacoes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias publicações" 
  ON public.publicacoes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para curtidas
CREATE POLICY "Qualquer usuário logado pode ver curtidas" 
  ON public.curtidas_publicacoes 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem curtir publicações" 
  ON public.curtidas_publicacoes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover suas curtidas" 
  ON public.curtidas_publicacoes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para comentários
CREATE POLICY "Qualquer usuário logado pode ver comentários" 
  ON public.comentarios_publicacoes 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem comentar publicações" 
  ON public.comentarios_publicacoes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus próprios comentários" 
  ON public.comentarios_publicacoes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios comentários" 
  ON public.comentarios_publicacoes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Adicionar contadores para melhor performance
ALTER TABLE public.publicacoes 
ADD COLUMN curtidas_count INTEGER DEFAULT 0,
ADD COLUMN comentarios_count INTEGER DEFAULT 0;

-- Função para atualizar contadores automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_contadores_publicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'curtidas_publicacoes' THEN
      UPDATE public.publicacoes 
      SET curtidas_count = curtidas_count + 1 
      WHERE id = NEW.publicacao_id;
    ELSIF TG_TABLE_NAME = 'comentarios_publicacoes' THEN
      UPDATE public.publicacoes 
      SET comentarios_count = comentarios_count + 1 
      WHERE id = NEW.publicacao_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'curtidas_publicacoes' THEN
      UPDATE public.publicacoes 
      SET curtidas_count = curtidas_count - 1 
      WHERE id = OLD.publicacao_id;
    ELSIF TG_TABLE_NAME = 'comentarios_publicacoes' THEN
      UPDATE public.publicacoes 
      SET comentarios_count = comentarios_count - 1 
      WHERE id = OLD.publicacao_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Triggers para atualizar contadores
CREATE TRIGGER trigger_curtidas_insert
  AFTER INSERT ON public.curtidas_publicacoes
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_contadores_publicacao();

CREATE TRIGGER trigger_curtidas_delete
  AFTER DELETE ON public.curtidas_publicacoes
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_contadores_publicacao();

CREATE TRIGGER trigger_comentarios_insert
  AFTER INSERT ON public.comentarios_publicacoes
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_contadores_publicacao();

CREATE TRIGGER trigger_comentarios_delete
  AFTER DELETE ON public.comentarios_publicacoes
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_contadores_publicacao();

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_atualizar_updated_at_publicacoes
  BEFORE UPDATE ON public.publicacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_atualizar_updated_at_comentarios
  BEFORE UPDATE ON public.comentarios_publicacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para as tabelas
ALTER TABLE public.publicacoes REPLICA IDENTITY FULL;
ALTER TABLE public.curtidas_publicacoes REPLICA IDENTITY FULL;
ALTER TABLE public.comentarios_publicacoes REPLICA IDENTITY FULL;

-- Adicionar às publicações realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.publicacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.curtidas_publicacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comentarios_publicacoes;
