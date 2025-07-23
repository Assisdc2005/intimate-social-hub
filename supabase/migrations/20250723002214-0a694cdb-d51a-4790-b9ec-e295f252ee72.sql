
-- Função para atualizar o tipo de assinatura no perfil
CREATE OR REPLACE FUNCTION atualizar_tipo_assinatura()
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

-- Trigger que executa após INSERT na tabela assinaturas
CREATE TRIGGER trigger_atualiza_tipo_assinatura
AFTER INSERT ON public.assinaturas
FOR EACH ROW
EXECUTE FUNCTION atualizar_tipo_assinatura();

-- Função para reverter o tipo de assinatura quando uma assinatura é cancelada/expirada
CREATE OR REPLACE FUNCTION reverter_tipo_assinatura()
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

-- Trigger que executa após UPDATE na tabela assinaturas
CREATE TRIGGER trigger_reverte_tipo_assinatura
AFTER UPDATE ON public.assinaturas
FOR EACH ROW
EXECUTE FUNCTION reverter_tipo_assinatura();
