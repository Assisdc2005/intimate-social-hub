-- Criar tabela de solicitações de amizade
CREATE TABLE IF NOT EXISTS public.solicitacoes_amizade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id UUID NOT NULL,
  destinatario_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aceito','recusado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(remetente_id, destinatario_id)
);

-- Criar tabela de amigos
CREATE TABLE IF NOT EXISTS public.amigos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amigo_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, amigo_id)
);

-- Criar tabela de depoimentos
CREATE TABLE IF NOT EXISTS public.depoimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id UUID NOT NULL,
  destinatario_id UUID NOT NULL,
  texto TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','recusado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar colunas de status online na tabela profiles se não existirem
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status_online TEXT DEFAULT 'offline' CHECK (status_online IN ('online','offline','ausente')),
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.solicitacoes_amizade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;

-- Policies para solicitacoes_amizade
CREATE POLICY "Usuários podem ver solicitações enviadas e recebidas" 
ON public.solicitacoes_amizade FOR SELECT 
USING (auth.uid() = remetente_id OR auth.uid() = destinatario_id);

CREATE POLICY "Usuários podem enviar solicitações" 
ON public.solicitacoes_amizade FOR INSERT 
WITH CHECK (auth.uid() = remetente_id);

CREATE POLICY "Usuários podem atualizar solicitações recebidas" 
ON public.solicitacoes_amizade FOR UPDATE 
USING (auth.uid() = destinatario_id);

-- Policies para amigos
CREATE POLICY "Usuários podem ver suas amizades" 
ON public.amigos FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = amigo_id);

CREATE POLICY "Sistema pode criar amizades" 
ON public.amigos FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários podem deletar suas amizades" 
ON public.amigos FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = amigo_id);

-- Policies para depoimentos
CREATE POLICY "Usuários podem ver depoimentos aprovados" 
ON public.depoimentos FOR SELECT 
USING (status = 'aprovado' OR auth.uid() = destinatario_id OR auth.uid() = autor_id);

CREATE POLICY "Usuários podem criar depoimentos" 
ON public.depoimentos FOR INSERT 
WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "Destinatários podem moderar depoimentos" 
ON public.depoimentos FOR UPDATE 
USING (auth.uid() = destinatario_id);

CREATE POLICY "Autores e destinatários podem deletar depoimentos" 
ON public.depoimentos FOR DELETE 
USING (auth.uid() = autor_id OR auth.uid() = destinatario_id);

-- Triggers para updated_at
CREATE TRIGGER update_solicitacoes_amizade_updated_at
  BEFORE UPDATE ON public.solicitacoes_amizade
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_depoimentos_updated_at
  BEFORE UPDATE ON public.depoimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para as novas tabelas
ALTER TABLE public.solicitacoes_amizade REPLICA IDENTITY FULL;
ALTER TABLE public.amigos REPLICA IDENTITY FULL;
ALTER TABLE public.depoimentos REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Adicionar às publicações do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes_amizade;
ALTER PUBLICATION supabase_realtime ADD TABLE public.amigos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.depoimentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;