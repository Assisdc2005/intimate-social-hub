-- Criar tabela para múltiplas mídias por publicação
CREATE TABLE public.publicacao_midias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacao_id UUID NOT NULL REFERENCES public.publicacoes(id) ON DELETE CASCADE,
  midia_url TEXT NOT NULL,
  tipo_midia TEXT NOT NULL DEFAULT 'imagem',
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.publicacao_midias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver mídias de publicações visíveis"
ON public.publicacao_midias
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.publicacoes p 
    WHERE p.id = publicacao_midias.publicacao_id 
    AND auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Usuários podem inserir mídias em suas publicações"
ON public.publicacao_midias
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.publicacoes p 
    WHERE p.id = publicacao_midias.publicacao_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar mídias de suas publicações"
ON public.publicacao_midias
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.publicacoes p 
    WHERE p.id = publicacao_midias.publicacao_id 
    AND p.user_id = auth.uid()
  )
);

-- Criar índice para melhor performance
CREATE INDEX idx_publicacao_midias_publicacao_id ON public.publicacao_midias(publicacao_id);
CREATE INDEX idx_publicacao_midias_ordem ON public.publicacao_midias(publicacao_id, ordem);