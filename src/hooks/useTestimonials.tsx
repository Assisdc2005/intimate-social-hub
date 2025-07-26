import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Testimonial {
  id: string;
  autor_id: string;
  destinatario_id: string;
  texto: string;
  status: 'pendente' | 'aprovado' | 'recusado';
  created_at: string;
  updated_at: string;
  author_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const useTestimonials = (profileUserId?: string) => {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileUserId) {
      fetchTestimonials();
      setupRealtimeSubscriptions();
    }
  }, [profileUserId, user?.id]);

  const fetchTestimonials = async () => {
    if (!profileUserId) return;

    try {
      setLoading(true);

      // Fetch approved testimonials for the profile
      const { data: approvedData } = await supabase
        .from('depoimentos')
        .select(`
          *,
          profiles!depoimentos_autor_id_fkey(display_name, avatar_url)
        `)
        .eq('destinatario_id', profileUserId)
        .eq('status', 'aprovado')
        .order('created_at', { ascending: false });

      // If viewing own profile, also fetch pending testimonials
      let pendingData = [];
      if (user?.id === profileUserId) {
        const { data: pending } = await supabase
          .from('depoimentos')
          .select(`
            *,
            profiles!depoimentos_autor_id_fkey(display_name, avatar_url)
          `)
          .eq('destinatario_id', profileUserId)
          .eq('status', 'pendente')
          .order('created_at', { ascending: false });
        
        pendingData = pending || [];
      }

      setTestimonials((approvedData as any) || []);
      setPendingTestimonials((pendingData as any));
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!profileUserId || !user?.id) return;

    const channel = supabase
      .channel('testimonials')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'depoimentos',
        filter: `destinatario_id=eq.${profileUserId}`
      }, () => {
        fetchTestimonials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createTestimonial = async (destinatarioId: string, texto: string) => {
    if (!user?.id) return { error: 'Usuário não autenticado' };
    if (!texto.trim()) return { error: 'Texto do depoimento é obrigatório' };

    try {
      const { error } = await supabase
        .from('depoimentos')
        .insert({
          autor_id: user.id,
          destinatario_id: destinatarioId,
          texto: texto.trim(),
          status: 'pendente'
        });

      if (error) throw error;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: destinatarioId,
          from_user_id: user.id,
          type: 'mensagem',
          content: 'enviou um novo depoimento'
        });

      return { success: true };
    } catch (error) {
      console.error('Error creating testimonial:', error);
      return { error: 'Erro ao criar depoimento' };
    }
  };

  const moderateTestimonial = async (testimonialId: string, action: 'aprovado' | 'recusado') => {
    if (!user?.id) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('depoimentos')
        .update({ status: action })
        .eq('id', testimonialId)
        .eq('destinatario_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error moderating testimonial:', error);
      return { error: 'Erro ao moderar depoimento' };
    }
  };

  const deleteTestimonial = async (testimonialId: string) => {
    if (!user?.id) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('depoimentos')
        .delete()
        .eq('id', testimonialId)
        .or(`autor_id.eq.${user.id},destinatario_id.eq.${user.id}`);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      return { error: 'Erro ao deletar depoimento' };
    }
  };

  return {
    testimonials,
    pendingTestimonials,
    loading,
    createTestimonial,
    moderateTestimonial,
    deleteTestimonial,
    refreshTestimonials: fetchTestimonials
  };
};