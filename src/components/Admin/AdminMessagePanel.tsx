import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function AdminMessagePanel() {
  const [messageType, setMessageType] = useState<'individual' | 'broadcast'>('individual');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Por favor, escreva uma mensagem');
      return;
    }

    if (messageType === 'individual' && !userEmail.trim()) {
      toast.error('Por favor, informe o email do destinatário');
      return;
    }

    try {
      setSending(true);

      if (messageType === 'individual') {
        // Buscar usuário pelo email através do auth
        const { data: authData } = await supabase.auth.admin.listUsers();
        const targetUser = authData?.users?.find((u: any) => u.email === userEmail);
        
        if (!targetUser) {
          toast.error('Usuário não encontrado');
          return;
        }

        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .eq('user_id', targetUser.id)
          .single();

        if (profileError || !profiles) {
          toast.error('Perfil do usuário não encontrado');
          return;
        }

        // Criar notificação individual
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: profiles.user_id,
            type: 'mensagem',
            content: message,
            from_user_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (notifError) throw notifError;
        toast.success(`Mensagem enviada para ${profiles.display_name}!`);
      } else {
        // Broadcast para todos os usuários
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id');

        if (profilesError) throw profilesError;

        const notifications = allProfiles.map(profile => ({
          user_id: profile.user_id,
          type: 'mensagem' as const,
          content: message,
          from_user_id: null
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) throw notifError;
        toast.success(`Mensagem enviada para ${allProfiles.length} usuários!`);
      }

      setMessage('');
      setUserEmail('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Enviar Mensagens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={messageType} onValueChange={(value: any) => setMessageType(value)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual">Mensagem Individual</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="broadcast" id="broadcast" />
            <Label htmlFor="broadcast">Broadcast (Todos os Usuários)</Label>
          </div>
        </RadioGroup>

        {messageType === 'individual' && (
          <div className="space-y-2">
            <Label htmlFor="email">Email do Destinatário</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="message">Mensagem</Label>
          <Textarea
            id="message"
            placeholder="Digite sua mensagem aqui..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </div>

        <Button 
          onClick={handleSendMessage} 
          disabled={sending}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {sending ? 'Enviando...' : messageType === 'broadcast' ? 'Enviar para Todos' : 'Enviar Mensagem'}
        </Button>
      </CardContent>
    </Card>
  );
}
