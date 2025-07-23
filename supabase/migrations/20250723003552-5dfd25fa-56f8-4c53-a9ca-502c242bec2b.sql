
-- Adicionar campos necessários na tabela profiles para conectar com assinaturas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tipo_assinatura TEXT DEFAULT 'gratuito',
ADD COLUMN IF NOT EXISTS assinatura_id UUID REFERENCES public.assinaturas(id);

-- Adicionar campo plano na tabela assinaturas se não existir
ALTER TABLE public.assinaturas 
ADD COLUMN IF NOT EXISTS plano TEXT;

-- Atualizar a coluna user_id para perfil_id na tabela assinaturas para melhor clareza
-- Primeiro vamos adicionar a nova coluna
ALTER TABLE public.assinaturas 
ADD COLUMN IF NOT EXISTS perfil_id UUID;

-- Copiar dados da coluna user_id para perfil_id (conectando via profiles)
UPDATE public.assinaturas 
SET perfil_id = profiles.id 
FROM public.profiles 
WHERE assinaturas.user_id = profiles.user_id;

-- Adicionar constraint de foreign key
ALTER TABLE public.assinaturas 
ADD CONSTRAINT fk_assinaturas_perfil 
FOREIGN KEY (perfil_id) REFERENCES public.profiles(id);

-- Criar política RLS para permitir que o sistema atualize profiles
CREATE POLICY IF NOT EXISTS "System can update profiles for subscriptions" 
ON public.profiles 
FOR UPDATE 
USING (true);
