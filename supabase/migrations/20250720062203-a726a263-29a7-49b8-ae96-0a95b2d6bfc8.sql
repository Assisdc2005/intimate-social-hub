-- Criar buckets para upload de imagens
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('publicacoes', 'publicacoes', true),
  ('fotos_perfil', 'fotos_perfil', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para bucket publicacoes
CREATE POLICY "Imagens públicas visíveis" ON storage.objects
FOR SELECT USING (bucket_id = 'publicacoes');

CREATE POLICY "Usuários podem enviar suas imagens" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'publicacoes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem atualizar suas imagens" ON storage.objects
FOR UPDATE USING (bucket_id = 'publicacoes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem deletar suas imagens" ON storage.objects
FOR DELETE USING (bucket_id = 'publicacoes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies para bucket fotos_perfil
CREATE POLICY "Fotos de perfil públicas visíveis" ON storage.objects
FOR SELECT USING (bucket_id = 'fotos_perfil');

CREATE POLICY "Usuários podem enviar suas fotos de perfil" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'fotos_perfil' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem atualizar suas fotos de perfil" ON storage.objects
FOR UPDATE USING (bucket_id = 'fotos_perfil' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem deletar suas fotos de perfil" ON storage.objects
FOR DELETE USING (bucket_id = 'fotos_perfil' AND auth.uid()::text = (storage.foldername(name))[1]);