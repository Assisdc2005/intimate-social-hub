
-- Verificar se os campos necessários existem na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assinatura_id UUID;

-- Atualizar a constraint de foreign key se necessário
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_profiles_assinatura' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT fk_profiles_assinatura 
        FOREIGN KEY (assinatura_id) REFERENCES public.assinaturas(id);
    END IF;
END $$;

-- Garantir que o trigger funciona corretamente
DROP TRIGGER IF EXISTS trigger_atualiza_tipo_assinatura ON public.assinaturas;
DROP FUNCTION IF EXISTS public.atualizar_tipo_assinatura();

-- Recriar função para atualizar o tipo de assinatura
CREATE OR REPLACE FUNCTION public.atualizar_tipo_assinatura()
RETURNS trigger AS $$
BEGIN
  -- Atualiza o campo tipo_assinatura do perfil vinculado à nova assinatura
  UPDATE public.profiles
  SET tipo_assinatura = 'premium',
      subscription_expires_at = NEW.data_fim,
      assinatura_id = NEW.id
  WHERE id = NEW.perfil_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger que executa após INSERT na tabela assinaturas
CREATE TRIGGER trigger_atualiza_tipo_assinatura
AFTER INSERT ON public.assinaturas
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_tipo_assinatura();

-- Garantir que o trigger de reversão funciona corretamente
DROP TRIGGER IF EXISTS trigger_reverte_tipo_assinatura ON public.assinaturas;
DROP FUNCTION IF EXISTS public.reverter_tipo_assinatura();

-- Recriar função para reverter o tipo de assinatura
CREATE OR REPLACE FUNCTION public.reverter_tipo_assinatura()
RETURNS trigger AS $$
BEGIN
  -- Se o status foi alterado para 'canceled' ou 'expired', atualiza o perfil
  IF NEW.status IN ('canceled', 'expired') AND OLD.status = 'active' THEN
    UPDATE public.profiles
    SET tipo_assinatura = 'gratuito',
        subscription_expires_at = NULL,
        assinatura_id = NULL
    WHERE id = NEW.perfil_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger que executa após UPDATE na tabela assinaturas
CREATE TRIGGER trigger_reverte_tipo_assinatura
AFTER UPDATE ON public.assinaturas
FOR EACH ROW
EXECUTE FUNCTION public.reverter_tipo_assinatura();

-- Política adicional para permitir que webhooks atualizem assinaturas
CREATE POLICY IF NOT EXISTS "Webhook can update subscription status" 
ON public.assinaturas 
FOR UPDATE 
USING (true);
