import { useState, useEffect } from "react";
import { Bell, Heart, UserPlus, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: 'curtida' | 'comentario' | 'visita' | 'mensagem' | 'novo_amigo';
  content: string;
  created_at: string;
  read_at?: string;
  from_user?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const NotificationButton = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { profile } = useProfile();

  const loadNotifications = async () => {
    if (!profile?.user_id) return;

    try {
      // First get notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (notificationsError) throw notificationsError;

      // Then get user info for each notification that has from_user_id
      const notificationsWithUser = await Promise.all(
        (notificationsData || []).map(async (notification) => {
          if (notification.from_user_id) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', notification.from_user_id)
              .single();

            return {
              ...notification,
              from_user: userData ? {
                display_name: userData.display_name,
                avatar_url: userData.avatar_url
              } : undefined
            };
          }
          return notification;
        })
      );

      setNotifications(notificationsWithUser);
      setUnreadCount(notificationsWithUser.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.user_id) return;

    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', profile.user_id)
        .is('read_at', null);

      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'curtida':
        return <Heart className="w-4 h-4 text-red-400" />;
      case 'novo_amigo':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'visita':
        return <Eye className="w-4 h-4 text-green-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-400" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d atrás`;
    }
  };

  useEffect(() => {
    if (profile?.user_id) {
      loadNotifications();
    }
  }, [profile]);

  useEffect(() => {
    if (showPanel) {
      loadNotifications();
    }
  }, [showPanel]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowPanel(!showPanel)}
        className="relative w-10 h-10 rounded-full hover:bg-primary/10"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {showPanel && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />
          
          {/* Notification Panel */}
          <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-hidden z-50 glass backdrop-blur-xl border-primary/20 shadow-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gradient">Notificações</CardTitle>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Marcar todas como lidas
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPanel(false)}
                    className="w-6 h-6"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação ainda</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-primary/5 cursor-pointer transition-colors ${
                        !notification.read_at ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => !notification.read_at && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {notification.from_user?.avatar_url ? (
                            <img
                              src={notification.from_user.avatar_url}
                              alt="Avatar"
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-secondary flex items-center justify-center text-white text-xs font-bold">
                              {notification.from_user?.display_name?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getNotificationIcon(notification.type)}
                            <span className="text-sm font-medium text-foreground truncate">
                              {notification.from_user?.display_name}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {notification.content}
                          </p>
                          
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        
                        {!notification.read_at && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};