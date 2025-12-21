import { useState, useEffect } from 'react';

import { Bell, BellRing, Check, CheckCheck, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useNotifications } from '@/hooks/useNotifications';

import { useFriendships } from '@/hooks/useFriendships';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type NotificationItem = ReturnType<typeof useNotifications>['notifications'][number];

export const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    getNotificationIcon, 
    getNotificationMessage 
  } = useNotifications();
  
  const { respondToFriendRequest, friendRequests } = useFriendships();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [adminPopup, setAdminPopup] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const unreadAdminMessage = notifications.find(
      (n) => n.type === 'mensagem' && !n.from_user_id && !n.read_at
    );

    if (unreadAdminMessage) {
      setAdminPopup(unreadAdminMessage);
    }
  }, [notifications]);

  const handleCloseAdminPopup = async () => {
    if (adminPopup && !adminPopup.read_at) {
      await markAsRead(adminPopup.id);
    }
    setAdminPopup(null);
  };

  const handleNotificationClick = async (notificationId: string, isRead: boolean, notificationType: string, fromUserId?: string) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
    
    // Handle navigation based on notification type
    if (notificationType === 'novo_amigo' || notificationType === 'mensagem') {
      // Open new tab for managing pending requests/testimonials
      const currentUrl = window.location.origin;
      const targetTab = notificationType === 'novo_amigo' ? 'pendentes' : 'depoimentos';
      window.open(`${currentUrl}?tab=${targetTab}`, '_blank');
      setIsOpen(false);
    }
  };

  const handleFriendRequestAction = async (requestId: string, action: 'aceito' | 'recusado', notificationId: string) => {
    const result = await respondToFriendRequest(requestId, action);
    
    if (result.success) {
      // Mark notification as read
      await markAsRead(notificationId);
      
      toast({
        title: action === 'aceito' ? 'Amizade aceita!' : 'Solicitação recusada',
        description: action === 'aceito' 
          ? 'Agora vocês são amigos!' 
          : 'A solicitação foi recusada.',
      });
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao processar solicitação',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-10 w-10 rounded-full hover:bg-white/10"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-white" />
        ) : (
          <Bell className="h-5 w-5 text-white" />
        )}
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[2147483647] flex items-start justify-center px-4 pt-24 pb-10 sm:pt-32"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/95 text-white shadow-[var(--shadow-glow)] max-h-[calc(100vh-8rem)]">
            <button
              className="absolute right-3 top-3 text-white/60 hover:text-white"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar notificações"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-neutral-900">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <Button
                    onClick={handleMarkAllAsRead}
                    size="sm"
                    variant="ghost"
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Marcar todas
                  </Button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="max-h-[60vh] bg-neutral-900/90">

              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-gray-400 mt-2">Carregando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                  <p className="text-gray-400 text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification) => {
                    const isAdminMessage = notification.type === 'mensagem' && !notification.from_user_id;
                    return (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                        isAdminMessage
                          ? 'bg-gradient-to-r from-purple-700/80 via-fuchsia-600/70 to-pink-500/70 border border-purple-400/60 shadow-[0_10px_35px_rgba(138,43,226,0.35)]'
                          : !notification.read_at
                            ? 'bg-primary/10 border-l-2 border-l-primary hover:bg-white/10'
                            : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => handleNotificationClick(notification.id, !!notification.read_at, notification.type, notification.from_user_id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Notification Icon */}
                        <div className="text-lg">

                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Notification Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${isAdminMessage ? 'text-white font-semibold' : 'text-white'}`}>
                            {isAdminMessage ? 'Mensagem da Administração' : getNotificationMessage(notification)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${isAdminMessage ? 'text-purple-100' : 'text-gray-400'}`}>
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                            {!notification.read_at && (
                              <div className={`w-2 h-2 rounded-full ${isAdminMessage ? 'bg-white' : 'bg-primary'}`}></div>
                            )}
                          </div>

                          {isAdminMessage && notification.content && (
                            <p className="mt-2 text-sm text-white/90">
                              {notification.content}
                            </p>
                          )}

                          {/* Friend Request Actions */}
                          {notification.type === 'novo_amigo' && !notification.read_at && notification.from_user_id && (
                            <div className="flex gap-2 mt-2">

                              {(() => {
                                const friendRequest = friendRequests.find(req => 
                                  req.remetente_id === notification.from_user_id && req.status === 'pendente'
                                );
                                return friendRequest ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFriendRequestAction(friendRequest.id, 'aceito', notification.id);
                                      }}
                                      className="h-7 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-full"
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      Aceitar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFriendRequestAction(friendRequest.id, 'recusado', notification.id);
                                      }}
                                      className="h-7 px-3 py-1 text-xs border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-full"
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      Recusar
                                    </Button>
                                  </>
                                ) : null;
                              })()}
                            </div>
                          )}

                          {/* Testimonial Actions - Note: 'depoimento' notifications need to be implemented */}
                          {notification.type === 'comentario' && !notification.read_at && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle testimonial approval - TODO: Implement testimonial moderation
                                  markAsRead(notification.id);
                                }}
                                className="h-7 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle testimonial rejection - TODO: Implement testimonial moderation
                                  markAsRead(notification.id);
                                }}
                                className="h-7 px-3 py-1 text-xs border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-full"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Recusar
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Mark as Read Button */}
                        {!notification.read_at && notification.type !== 'novo_amigo' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/10 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 text-xs"
                  onClick={() => setIsOpen(false)}
                >
                  Ver todas as notificações
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {adminPopup && (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-purple-400/60 bg-neutral-900/95 p-6 text-center shadow-[0_25px_70px_rgba(138,43,226,0.45)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-2xl font-black text-white">
              S
            </div>
            <h3 className="text-xl font-bold text-white">Mensagem importante da Administração</h3>
            <p className="mt-3 text-sm text-purple-100 whitespace-pre-line">
              {adminPopup.content || 'Você recebeu uma nova mensagem da equipe Sensual.'}
            </p>
            <p className="mt-2 text-xs text-purple-200/80">
              Esta mensagem foi enviada para todos os usuários. Leia com atenção.
            </p>
            <Button
              className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
              onClick={handleCloseAdminPopup}
            >
              Entendi
            </Button>
          </div>
        </div>
      )}
    </>
  );
};