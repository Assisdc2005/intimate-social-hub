import { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TestimonialsSectionProps {
  profileUserId: string;
}

export const TestimonialsSection = ({ profileUserId }: TestimonialsSectionProps) => {
  const { user } = useAuth();
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();
  const {
    testimonials,
    pendingTestimonials,
    loading,
    createTestimonial,
    moderateTestimonial,
    deleteTestimonial
  } = useTestimonials(profileUserId);

  const [newTestimonial, setNewTestimonial] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWriteForm, setShowWriteForm] = useState(false);

  const isOwnProfile = user?.id === profileUserId;

  const handleSubmitTestimonial = async () => {
    if (!newTestimonial.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um depoimento antes de enviar',
        variant: 'destructive',
      });
      return;
    }

    if (!isPremium && !isOwnProfile) {
      toast({
        title: 'Recurso Premium',
        description: 'Assine o Premium para deixar depoimentos',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTestimonial(profileUserId, newTestimonial);
      
      if (result.success) {
        setNewTestimonial('');
        setShowWriteForm(false);
        toast({
          title: 'Depoimento enviado!',
          description: 'Seu depoimento foi enviado e está aguardando aprovação.',
        });
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao enviar depoimento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao enviar depoimento',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModerate = async (testimonialId: string, action: 'aprovado' | 'recusado') => {
    const result = await moderateTestimonial(testimonialId, action);
    
    if (result.success) {
      toast({
        title: action === 'aprovado' ? 'Depoimento aprovado!' : 'Depoimento recusado',
        description: action === 'aprovado' 
          ? 'O depoimento agora está visível em seu perfil.'
          : 'O depoimento foi recusado e removido.',
      });
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao moderar depoimento',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (testimonialId: string) => {
    const result = await deleteTestimonial(testimonialId);
    
    if (result.success) {
      toast({
        title: 'Depoimento removido',
        description: 'O depoimento foi removido com sucesso.',
      });
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao remover depoimento',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-400 mt-2">Carregando depoimentos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass backdrop-blur-xl border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-gradient">
          <MessageSquare className="w-6 h-6" />
          Depoimentos
          <Badge className="bg-gradient-primary text-white">
            {testimonials.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Write Testimonial Section */}
        {!isOwnProfile && user && (
          <div className="space-y-4">
            {!showWriteForm ? (
              <Button
                onClick={() => setShowWriteForm(true)}
                className="w-full bg-gradient-secondary hover:opacity-90 text-white"
              >
                <Star className="w-4 h-4 mr-2" />
                Deixar Depoimento
              </Button>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={newTestimonial}
                  onChange={(e) => setNewTestimonial(e.target.value)}
                  placeholder="Compartilhe sua experiência com esta pessoa..."
                  className="glass border-primary/30 text-white placeholder:text-gray-400 min-h-[100px]"
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {newTestimonial.length}/500 caracteres
                  </span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setShowWriteForm(false);
                        setNewTestimonial('');
                      }}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmitTestimonial}
                      disabled={isSubmitting || !newTestimonial.trim()}
                      size="sm"
                      className="bg-gradient-primary hover:opacity-90 text-white"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Testimonials (only for profile owner) */}
        {isOwnProfile && pendingTestimonials.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Aguardando Moderação
            </h4>
            {pendingTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-orange-500/10 border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold">
                        {(testimonial as any).author_profile?.display_name?.[0]}
                      </div>
                      <div>
                        <h5 className="font-semibold text-white">
                          {(testimonial as any).author_profile?.display_name}
                        </h5>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(testimonial.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-4">{testimonial.texto}</p>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleModerate(testimonial.id, 'aprovado')}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleModerate(testimonial.id, 'recusado')}
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Recusar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Approved Testimonials */}
        {testimonials.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              Depoimentos Aprovados
            </h4>
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold">
                        {(testimonial as any).author_profile?.display_name?.[0]}
                      </div>
                      <div>
                        <h5 className="font-semibold text-white">
                          {(testimonial as any).author_profile?.display_name}
                        </h5>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(testimonial.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Delete button for profile owner or testimonial author */}
                    {(isOwnProfile || user?.id === testimonial.autor_id) && (
                      <Button
                        onClick={() => handleDelete(testimonial.id)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-gray-300">{testimonial.texto}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
            <h4 className="font-semibold text-gray-300 mb-2">Nenhum depoimento ainda</h4>
            <p className="text-sm text-gray-400">
              {isOwnProfile 
                ? 'Quando alguém deixar um depoimento sobre você, ele aparecerá aqui.'
                : 'Seja o primeiro a deixar um depoimento sobre esta pessoa!'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};