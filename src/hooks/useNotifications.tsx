import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  from_user_id?: string;
  type: 'curtida' | 'novo_amigo' | 'visita' | 'comentario' | 'mensagem' | 'depoimento';
  content?: string;
  read_at?: string;
  created_at: string;

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
  const { toast } = useToast();
  const initialPopupShownRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      const data = await fetchNotifications();

      // Ao abrir o app, mostrar popups para notificações recentes (até 2 minutos) de visita/depoimento
      if (!initialPopupShownRef.current && data && data.length > 0) {
        showRecentImportantPopups(data as Notification[]);
        initialPopupShownRef.current = true;
      }

      cleanup = setupRealtimeSubscriptions();
    };

    init();

    return () => {
      if (cleanup) cleanup();
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data: notificationsData } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles!notifications_from_user_id_fkey(display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications((notificationsData as any) || []);

      // Count unread notifications
      const unread = notificationsData?.filter(n => !n.read_at).length || 0;
      setUnreadCount(unread);

      return (notificationsData as any) || [];
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
      }, (payload: any) => {
        const newNotification = payload.new as Notification;

        // Atualiza lista normalmente
        fetchNotifications();

        const isAdminMessage = newNotification.type === 'mensagem' && !newNotification.from_user_id;

        if (newNotification.type === 'mensagem') {
          toast({
            title: isAdminMessage ? 'Mensagem da Administração' : 'Nova mensagem',
            description: newNotification.content || getRealtimeDescription(newNotification),
            className: isAdminMessage
              ? 'border border-purple-400 bg-gradient-to-r from-purple-700 to-pink-600 text-white'
              : undefined,
          });
        } else {
          toast({
            title: 'Nova notificação',
            description: getRealtimeDescription(newNotification),
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const showRecentImportantPopups = (list: Notification[]) => {
    const TWO_MIN_MS = 2 * 60 * 1000;
    const now = Date.now();

    list
      .filter((n) =>
        !n.read_at &&
        now - new Date(n.created_at).getTime() <= TWO_MIN_MS &&
        now - new Date(n.created_at).getTime() >= 0
      )
      .forEach((n) => {
        const msg = getNotificationMessage(n as any);
        toast({
          title: 'Nova notificação',
          description: msg,
        });
      });
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
      default:
        return '🔔';
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const name = (notification as any).from_user_profile?.display_name || 'Alguém';
    
    switch (notification.type) {
      case 'curtida':
        return `${name} curtiu seu perfil`;
      case 'novo_amigo':
        return `${name} quer ser seu amigo`;
      case 'visita':
        return `${name} visitou seu perfil`;
      case 'comentario':
        return `${name} comentou em sua publicação`;
      case 'mensagem':
        return `${name} enviou uma mensagem`;
      default:
        return notification.content || 'Nova notificação';
    }
  };

  const getRealtimeDescription = (notification: Notification) => {
    if (notification.content) return notification.content;

    switch (notification.type) {
      case 'curtida':
        return 'Você recebeu uma nova curtida.';
      case 'novo_amigo':
        return 'Você recebeu uma nova solicitação de amizade.';
      case 'visita':
        return 'Alguém visitou seu perfil.';
      case 'comentario':
        return 'Você recebeu um novo comentário.';
      case 'depoimento':
        return 'Você recebeu um novo depoimento.';
      case 'mensagem':
        return 'Você recebeu uma nova mensagem.';
      default:
        return 'Você recebeu uma nova notificação.';
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
    refreshNotifications: fetchNotifications
  };
};