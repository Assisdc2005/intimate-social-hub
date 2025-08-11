import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  user_id: string;
  from_user_id?: string;
  type: 'curtida' | 'novo_amigo' | 'visita' | 'comentario' | 'mensagem' | 'depoimento';
  content?: string;
  read_at?: string;
  created_at: string;
  reference_id?: string;
  reference_type?: string;
  from_user_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      setupRealtimeSubscriptions();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data: notificationsData } = await supabase
        .from('notifications')
        .select(`
          *,
          from_user_profile:profiles!notifications_from_user_id_fkey(display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications((notificationsData as any) || []);
      
      // Count unread notifications
      const unread = notificationsData?.filter(n => !n.read_at).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      ));

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        read_at: notification.read_at || new Date().toISOString()
      })));

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'curtida':
        return '❤️';
      case 'novo_amigo':
        return '👤';
      case 'visita':
        return '👁️';
      case 'comentario':
        return '💭';
      case 'mensagem':
        return '💌';
      case 'depoimento':
        return '📝';
      default:
        return '🔔';
    }
  };

  const processNotificationAction = async (notificationId: string, action: 'aceitar' | 'recusar') => {
    if (!user?.id) return { success: false, error: 'Usuário não autenticado' };

    try {
      // Get notification details first
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (fetchError) throw fetchError;

      // For now, just mark as read since the specific implementation depends on the notification content
      // In the future, this can be expanded to handle different notification types

      // Mark notification as read
      await markAsRead(notificationId);

      // Refresh notifications after processing
      await fetchNotifications();

      return { success: true };
    } catch (error) {
      console.error('Error processing notification action:', error);
      return { success: false, error: (error as any).message };
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const name = (notification as any).from_user_profile?.display_name || 'Alguém';
    
    switch (notification.type) {
      case 'curtida':
        return `${name} curtiu seu perfil`;
      case 'novo_amigo':
        return `${name} enviou uma solicitação de amizade`;
      case 'visita':
        return `${name} visitou seu perfil`;
      case 'comentario':
        return `${name} comentou em sua publicação`;
      case 'mensagem':
        return `${name} enviou uma mensagem`;
      case 'depoimento':
        return `${name} deixou um depoimento para você`;
      default:
        return notification.content || 'Nova notificação';
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    getNotificationMessage,
    processNotificationAction,
    refreshNotifications: fetchNotifications
  };
};