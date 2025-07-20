
-- Adicionar os campos que estão faltando na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tipo_assinatura TEXT DEFAULT 'gratuito',
ADD COLUMN IF NOT EXISTS assinatura_id UUID;

-- Adicionar o campo plano na tabela assinaturas se não existir
ALTER TABLE public.assinaturas 
ADD COLUMN IF NOT EXISTS plano TEXT;

-- Adicionar a coluna perfil_id na tabela assinaturas
ALTER TABLE public.assinaturas 
ADD COLUMN IF NOT EXISTS perfil_id UUID;

-- Atualizar dados existentes para conectar perfil_id com profiles
UPDATE public.assinaturas 
SET perfil_id = profiles.id 
FROM public.profiles 
WHERE assinaturas.user_id = profiles.user_id
AND assinaturas.perfil_id IS NULL;

-- Adicionar constraint de foreign key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_assinaturas_perfil' 
        AND table_name = 'assinaturas'
    ) THEN
        ALTER TABLE public.assinaturas 
        ADD CONSTRAINT fk_assinaturas_perfil 
        FOREIGN KEY (perfil_id) REFERENCES public.profiles(id);
    END IF;
END $$;

-- Criar política RLS para permitir que o sistema atualize profiles
DROP POLICY IF EXISTS "System can update profiles for subscriptions" ON public.profiles;
CREATE POLICY "System can update profiles for subscriptions" 
ON public.profiles 
FOR UPDATE 
USING (true);
