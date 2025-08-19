import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, MessageSquare, User } from 'lucide-react';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const TestimonialsManagement = () => {
  const { user } = useAuth();
  const { pendingTestimonials, moderateTestimonial, loading } = useTestimonials(user?.id);
  const { toast } = useToast();

  const handleModerate = async (testimonialId: string, action: 'aprovado' | 'recusado') => {
    const result = await moderateTestimonial(testimonialId, action);
    
    if (result.success) {
      toast({
        title: action === 'aprovado' ? 'Depoimento aprovado!' : 'Depoimento recusado',
        description: action === 'aprovado' 
          ? 'O depoimento será exibido em seu perfil'
          : 'O depoimento foi recusado e removido',
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao moderar depoimento",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-glass backdrop-blur-md border-primary/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Depoimentos Pendentes ({pendingTestimonials.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingTestimonials.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum depoimento pendente</p>
            <p className="text-sm mt-1">Novos depoimentos aparecerão aqui para moderação</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTestimonials.map((testimonial) => (
              <div 
                key={testimonial.id} 
                className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3"
              >
                {/* Author Profile */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={testimonial.author_profile?.avatar_url} 
                      alt={testimonial.author_profile?.display_name} 
                    />
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {testimonial.author_profile?.display_name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">
                      {testimonial.author_profile?.display_name || 'Usuário Anônimo'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(testimonial.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge className="ml-auto bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    Pendente
                  </Badge>
                </div>

                {/* Testimonial Text */}
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    "{testimonial.texto}"
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleModerate(testimonial.id, 'aprovado')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => handleModerate(testimonial.id, 'recusado')}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};