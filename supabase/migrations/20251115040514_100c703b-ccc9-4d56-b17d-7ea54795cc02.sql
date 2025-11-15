-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela user_roles (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function para verificar role (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para admins acessarem tudo
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RPC: Métricas gerais do dashboard
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_premium', (SELECT COUNT(*) FROM profiles WHERE tipo_assinatura = 'premium'),
    'total_free', (SELECT COUNT(*) FROM profiles WHERE tipo_assinatura = 'gratuito'),
    'recent_users_7d', (SELECT COUNT(*) FROM profiles WHERE created_at >= now() - interval '7 days'),
    'active_users_24h', (SELECT COUNT(DISTINCT user_id) FROM profiles WHERE last_seen >= now() - interval '24 hours'),
    'total_men', (SELECT COUNT(*) FROM profiles WHERE gender = 'masculino'),
    'total_women', (SELECT COUNT(*) FROM profiles WHERE gender = 'feminino'),
    'total_other', (SELECT COUNT(*) FROM profiles WHERE gender NOT IN ('masculino', 'feminino') AND gender IS NOT NULL),
    'total_posts', (SELECT COUNT(*) FROM publicacoes),
    'total_messages', (SELECT COUNT(*) FROM messages)
  ) INTO result;

  RETURN result;
END;
$$;

-- RPC: Distribuição de idade
CREATE OR REPLACE FUNCTION public.get_age_distribution()
RETURNS TABLE(age_group TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT 
    CASE 
      WHEN EXTRACT(YEAR FROM AGE(birth_date)) < 18 THEN 'Menor de 18'
      WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 18 AND 24 THEN '18-24'
      WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 25 AND 34 THEN '25-34'
      WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 35 AND 44 THEN '35-44'
      WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 45 AND 54 THEN '45-54'
      WHEN EXTRACT(YEAR FROM AGE(birth_date)) >= 55 THEN '55+'
      ELSE 'Não informado'
    END AS age_group,
    COUNT(*) AS count
  FROM profiles
  WHERE birth_date IS NOT NULL
  GROUP BY age_group
  ORDER BY 
    CASE age_group
      WHEN 'Menor de 18' THEN 1
      WHEN '18-24' THEN 2
      WHEN '25-34' THEN 3
      WHEN '35-44' THEN 4
      WHEN '45-54' THEN 5
      WHEN '55+' THEN 6
      ELSE 7
    END;
END;
$$;

-- RPC: Histórico de cadastros por dia (últimos 30 dias)
CREATE OR REPLACE FUNCTION public.get_users_history()
RETURNS TABLE(date DATE, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS count
  FROM profiles
  WHERE created_at >= now() - interval '30 days'
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$;

-- RPC: Liberar premium para usuário
CREATE OR REPLACE FUNCTION public.admin_grant_premium(target_user_id UUID, days INTEGER DEFAULT 30)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Atualizar perfil para premium
  UPDATE profiles
  SET tipo_assinatura = 'premium'
  WHERE user_id = target_user_id;

  -- Inserir assinatura administrativa
  INSERT INTO assinaturas (
    user_id,
    perfil_id,
    plano,
    periodo,
    status,
    stripe_price_id,
    data_inicio,
    data_fim,
    valor
  )
  VALUES (
    target_user_id,
    (SELECT id FROM profiles WHERE user_id = target_user_id),
    'admin_granted',
    days || ' dias',
    'active',
    'admin_grant',
    now(),
    now() + (days || ' days')::interval,
    0
  );
END;
$$;

-- RPC: Remover premium de usuário
CREATE OR REPLACE FUNCTION public.admin_revoke_premium(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Atualizar perfil para gratuito
  UPDATE profiles
  SET tipo_assinatura = 'gratuito'
  WHERE user_id = target_user_id;

  -- Cancelar assinaturas ativas
  UPDATE assinaturas
  SET status = 'canceled'
  WHERE user_id = target_user_id AND status = 'active';
END;
$$;

-- RPC: Deletar usuário completamente
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Deletar dados relacionados (cascade vai cuidar de algumas, mas vamos ser explícitos)
  DELETE FROM messages WHERE sender_id = target_user_id;
  DELETE FROM conversations WHERE participant1_id = target_user_id OR participant2_id = target_user_id;
  DELETE FROM publicacoes WHERE user_id = target_user_id;
  DELETE FROM posts WHERE user_id = target_user_id;
  DELETE FROM curtidas_publicacoes WHERE user_id = target_user_id;
  DELETE FROM comentarios_publicacoes WHERE user_id = target_user_id;
  DELETE FROM likes WHERE user_id = target_user_id;
  DELETE FROM comments WHERE user_id = target_user_id;
  DELETE FROM assinaturas WHERE user_id = target_user_id;
  DELETE FROM amigos WHERE user_id = target_user_id OR amigo_id = target_user_id;
  DELETE FROM depoimentos WHERE autor_id = target_user_id OR destinatario_id = target_user_id;
  DELETE FROM profiles WHERE user_id = target_user_id;
  DELETE FROM user_roles WHERE user_id = target_user_id;
  
  -- Deletar do auth (isso vai acionar cascata)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- RPC: Listar todos os usuários para admin
CREATE OR REPLACE FUNCTION public.admin_get_all_users(
  search_term TEXT DEFAULT NULL,
  filter_type TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  gender TEXT,
  tipo_assinatura TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  birth_date DATE,
  city TEXT,
  state TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    u.email,
    p.avatar_url,
    p.gender::TEXT,
    p.tipo_assinatura,
    p.created_at,
    p.last_seen,
    p.birth_date,
    p.city,
    p.state
  FROM profiles p
  LEFT JOIN auth.users u ON p.user_id = u.id
  WHERE 
    (search_term IS NULL OR 
     p.display_name ILIKE '%' || search_term || '%' OR 
     u.email ILIKE '%' || search_term || '%')
    AND
    (filter_type IS NULL OR 
     (filter_type = 'premium' AND p.tipo_assinatura = 'premium') OR
     (filter_type = 'free' AND p.tipo_assinatura = 'gratuito') OR
     (filter_type = 'recent' AND p.created_at >= now() - interval '7 days'))
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Inserir role 'user' para todos os usuários existentes
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'user'::app_role
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = profiles.user_id
);

-- Criar usuário admin (caso não exista)
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Verificar se o usuário admin já existe
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@sensual.com';

  -- Se não existir, criar (nota: isso pode falhar se executado pelo cliente)
  -- O usuário admin deve ser criado manualmente via Supabase Dashboard
  -- Mas vamos preparar a role para quando ele for criado
  
  -- Se existir, garantir que tem role de admin
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;