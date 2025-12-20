import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export interface Live {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'online' | 'offline' | 'ended';
  viewers_count: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url?: string | null;
  } | null;
}

export const useLives = () => {
  const { profile } = useProfile();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLives = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('lives')
        .select(`
          *,
          profiles!lives_user_id_fkey(display_name, avatar_url)
        `)
        .eq('status', 'online')
        .order('started_at', { ascending: false });

      if (error) throw error;
      setLives((data as any) || []);
    } catch (e: any) {
      console.error('Erro ao carregar lives:', e);
      setError(e.message || 'Erro ao carregar lives');
    } finally {
      setLoading(false);
    }
  };

  const startLive = async (title: string, description?: string) => {
    if (!profile?.user_id) return { error: 'Usuário não autenticado', liveId: null as string | null };

    try {
      const { data: existing } = await supabase
        .from('lives')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('status', 'online')
        .maybeSingle();

      const payload = {
        user_id: profile.user_id,
        title,
        description: description || null,
        status: 'online' as const,
        started_at: new Date().toISOString(),
        ended_at: null as string | null,
      };

      let liveId: string;

      if (existing) {
        const { error } = await supabase
          .from('lives')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
        liveId = existing.id;
      } else {
        const { data: inserted, error } = await supabase
          .from('lives')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        liveId = (inserted as any).id as string;
      }

      await fetchLives();
      return { error: null, liveId };
    } catch (e: any) {
      console.error('Erro ao iniciar live:', e);
      return { error: e.message || 'Erro ao iniciar live', liveId: null };
    }
  };

  const endLive = async () => {
    if (!profile?.user_id) return { error: 'Usuário não autenticado' };

    try {
      const { data: existing } = await supabase
        .from('lives')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('status', 'online')
        .maybeSingle();

      if (!existing) return { error: null };

      const { error } = await supabase
        .from('lives')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          viewers_count: 0,
        })
        .eq('id', existing.id);

      if (error) throw error;
      await fetchLives();
      return { error: null };
    } catch (e: any) {
      console.error('Erro ao encerrar live:', e);
      return { error: e.message || 'Erro ao encerrar live' };
    }
  };

  useEffect(() => {
    fetchLives();

    const channel = supabase
      .channel('realtime-lives')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lives' }, () => {
        fetchLives();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  return {
    lives,
    loading,
    error,
    startLive,
    endLive,
    refreshLives: fetchLives,
  };
}
