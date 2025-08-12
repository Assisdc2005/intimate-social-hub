import { useState } from 'react';
import { Bell, BellRing, Check, CheckCheck, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { useFriendships } from '@/hooks/useFriendships';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-white/10"
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
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0 glass backdrop-blur-xl border-primary/20"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
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
        <ScrollArea className="h-80">
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
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 hover:bg-white/10 ${
                    !notification.read_at ? 'bg-primary/10 border-l-2 border-l-primary' : 'bg-white/5'
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
                      <p className="text-sm text-white">
                        {getNotificationMessage(notification)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                        {!notification.read_at && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      
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
              ))}
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
      </PopoverContent>
    </Popover>
  );
};