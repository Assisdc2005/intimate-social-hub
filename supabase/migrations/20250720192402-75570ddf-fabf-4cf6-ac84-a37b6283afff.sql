
-- Criar tabela de assinaturas
CREATE TABLE public.assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fim TIMESTAMPTZ NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  periodo TEXT NOT NULL, -- 'semanal', 'quinzenal', 'mensal'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de assinaturas
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para assinaturas
CREATE POLICY "Users can view their own subscriptions" ON public.assinaturas
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert subscriptions" ON public.assinaturas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update subscriptions" ON public.assinaturas
  FOR UPDATE USING (true);

-- Adicionar campo premium_status na tabela profiles se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS premium_status TEXT DEFAULT 'nao_premium';

-- Função para verificar e atualizar status premium
CREATE OR REPLACE FUNCTION public.verificar_status_premium()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar usuários para não premium se a assinatura expirou
  UPDATE public.profiles 
  SET premium_status = 'nao_premium'
  WHERE user_id IN (
    SELECT DISTINCT a.user_id 
    FROM public.assinaturas a
    WHERE a.data_fim < now() 
    AND a.status = 'active'
  );
  
  -- Atualizar status das assinaturas expiradas
  UPDATE public.assinaturas 
  SET status = 'expired'
  WHERE data_fim < now() 
  AND status = 'active';
  
  -- Atualizar usuários para premium se têm assinatura ativa
  UPDATE public.profiles 
  SET premium_status = 'premium'
  WHERE user_id IN (
    SELECT DISTINCT a.user_id 
    FROM public.assinaturas a
    WHERE a.data_fim > now() 
    AND a.status = 'active'
  );
END;
$$;

-- Trigger para atualizar campo updated_at
CREATE TRIGGER update_assinaturas_updated_at
  BEFORE UPDATE ON public.assinaturas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
