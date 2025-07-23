-- Criar tabela para rastrear checkouts da Cakto
CREATE TABLE IF NOT EXISTS public.cakto_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checkout_id TEXT UNIQUE,
  amount DECIMAL(10,2),
  periodo TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.cakto_checkouts ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Users can view their own checkouts" 
ON public.cakto_checkouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert checkouts" 
ON public.cakto_checkouts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update checkouts" 
ON public.cakto_checkouts 
FOR UPDATE 
USING (true);

-- Adicionar campos para identificar checkouts da Cakto na tabela de assinaturas
ALTER TABLE public.assinaturas 
ADD COLUMN IF NOT EXISTS cakto_checkout_id TEXT;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_cakto_checkouts_user_id ON public.cakto_checkouts(user_id);
CREATE INDEX IF NOT EXISTS idx_cakto_checkouts_checkout_id ON public.cakto_checkouts(checkout_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_cakto_checkout_id ON public.assinaturas(cakto_checkout_id);