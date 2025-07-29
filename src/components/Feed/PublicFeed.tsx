import { useState, useEffect } from "react";
import { Heart, MessageCircle, Plus, Send, User, Clock, Crown } from "lucide-react";
import { PhotoGrid } from "@/components/Profile/PhotoGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Publicacao {
  id: string;
  user_id: string;
  midia_url?: string;
  tipo_midia: string;
  descricao?: string;
  created_at: string;
  curtidas_count: number;
  comentarios_count: number;
  profiles?: {
    display_name: string;
    avatar_url?: string;
    city?: string;
    state?: string;
    tipo_assinatura?: string;
  };
}

interface Comentario {
  id: string;
  comentario: string;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const PublicFeed = () => {
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ descricao: '', midia_url: '' });
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [comentarios, setComentarios] = useState<{ [key: string]: Comentario[] }>({});
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchPublicacoes();
    fetchUserLikes();

    // Set up real-time subscription
    const channel = supabase
      .channel('publicacoes_feed')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'publicacoes' },
        (payload) => {
          fetchPublicacoes(); // Refresh the feed when new post is added
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'publicacoes' },
        (payload) => {
          setPublicacoes(prev => prev.map(pub => 
            pub.id === payload.new.id ? { ...pub, ...payload.new } : pub
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  const fetchPublicacoes = async () => {
    try {
      // First get publicacoes
      const { data: publicacoesData, error: publicacoesError } = await supabase
        .from('publicacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (publicacoesError) throw publicacoesError;

      if (!publicacoesData) {
        setPublicacoes([]);
        return;
      }

      // Then get profiles for each publication
      const userIds = [...new Set(publicacoesData.map(pub => pub.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, city, state, tipo_assinatura')
        .in('user_id', userIds);

      // Combine data
      const publicacoesWithProfiles = publicacoesData.map(pub => ({
        ...pub,
        profiles: profilesData?.find(profile => profile.user_id === pub.user_id)
      }));

      setPublicacoes(publicacoesWithProfiles);
    } catch (error) {
      console.error('Erro ao buscar publicações:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!profile?.user_id) return;

    try {
      const { data } = await supabase
        .from('curtidas_publicacoes')
        .select('publicacao_id')
        .eq('user_id', profile.user_id);

      setUserLikes(new Set(data?.map(like => like.publicacao_id) || []));
    } catch (error) {
      console.error('Erro ao buscar curtidas:', error);
    }
  };

  const fetchComentarios = async (publicacaoId: string) => {
    try {
      // First get comments
      const { data: comentariosData } = await supabase
        .from('comentarios_publicacoes')
        .select('*')
        .eq('publicacao_id', publicacaoId)
        .order('created_at', { ascending: false });

      if (!comentariosData) {
        setComentarios(prev => ({ ...prev, [publicacaoId]: [] }));
        return;
      }

      // Then get profiles for each comment
      const userIds = [...new Set(comentariosData.map(com => com.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      // Combine data
      const comentariosWithProfiles = comentariosData.map(com => ({
        ...com,
        profiles: profilesData?.find(profile => profile.user_id === com.user_id)
      }));

      setComentarios(prev => ({ ...prev, [publicacaoId]: comentariosWithProfiles }));
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.descricao.trim() && !newPost.midia_url) {
      toast({
        title: "Erro",
        description: "Adicione um conteúdo ou mídia",
        variant: "destructive",
      });
      return;
    }

    try {
      let mediaUrl = newPost.midia_url;
      let mediaType = 'texto';

      // Upload image to Supabase Storage if a file was selected
      if (newPost.midia_url && newPost.midia_url.startsWith('blob:')) {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const selectedFile = fileInput?.files?.[0];
        
        if (selectedFile) {
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `${profile?.user_id}/${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('publicacoes')
            .upload(fileName, selectedFile);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('publicacoes')
            .getPublicUrl(fileName);

          mediaUrl = publicUrl;
          mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'imagem';
        }
      }

      const { error } = await supabase
        .from('publicacoes')
        .insert({
          user_id: profile?.user_id,
          descricao: newPost.descricao,
          tipo_midia: mediaType,
          midia_url: mediaUrl
        });

      if (error) throw error;

      toast({
        title: "Publicação criada!",
        description: "Sua publicação foi criada com sucesso",
      });

      setNewPost({ descricao: '', midia_url: '' });
      setShowCreatePost(false);
      
    } catch (error) {
      console.error('Erro ao criar publicação:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar publicação",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (publicacaoId: string) => {
    if (!isPremium) {
      toast({
        title: "Seja Premium para curtir publicações",
        description: "Faça upgrade para o Premium e libere curtidas ilimitadas",
        variant: "destructive",
      });
      return;
    }

    try {
      const isLiked = userLikes.has(publicacaoId);
      
      if (isLiked) {
        // Unlike
        await supabase
          .from('curtidas_publicacoes')
          .delete()
          .eq('publicacao_id', publicacaoId)
          .eq('user_id', profile?.user_id);
        
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(publicacaoId);
          return newSet;
        });
      } else {
        // Like
        await supabase
          .from('curtidas_publicacoes')
          .insert({ publicacao_id: publicacaoId, user_id: profile?.user_id });
        
        setUserLikes(prev => new Set([...prev, publicacaoId]));
      }

      // Update local state
      setPublicacoes(prev => prev.map(pub => 
        pub.id === publicacaoId 
          ? { ...pub, curtidas_count: isLiked ? pub.curtidas_count - 1 : pub.curtidas_count + 1 }
          : pub
      ));

    } catch (error) {
      console.error('Erro ao curtir:', error);
    }
  };

  const handleComment = async (publicacaoId: string) => {
    if (!isPremium) {
      toast({
        title: "Seja Premium para comentar publicações",
        description: "Faça upgrade para o Premium e libere comentários ilimitados",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comentarios_publicacoes')
        .insert({
          publicacao_id: publicacaoId,
          user_id: profile?.user_id,
          comentario: newComment
        });

      if (error) throw error;

      setNewComment('');
      
      // Update local state
      setPublicacoes(prev => prev.map(pub => 
        pub.id === publicacaoId 
          ? { ...pub, comentarios_count: pub.comentarios_count + 1 }
          : pub
      ));

      // Refresh comments for this post
      fetchComentarios(publicacaoId);

    } catch (error) {
      console.error('Erro ao comentar:', error);
    }
  };

  const toggleComments = (publicacaoId: string) => {
    setShowComments(prev => ({ ...prev, [publicacaoId]: !prev[publicacaoId] }));
    if (!comentarios[publicacaoId]) {
      fetchComentarios(publicacaoId);
    }
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white">Carregando publicações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com título e botão criar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gradient">Publicações Recentes</h2>
        
        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white rounded-full px-6 py-2">
              <Plus className="h-5 w-5 mr-2" />
              Criar Publicação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background/95 backdrop-blur border-white/20">
            <DialogHeader>
              <DialogTitle className="text-gradient">Criar Nova Publicação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="O que você está pensando? (máx. 500 caracteres)"
                value={newPost.descricao}
                onChange={(e) => setNewPost({...newPost, descricao: e.target.value})}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                rows={4}
                maxLength={500}
              />
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Anexar Imagem/Vídeo (opcional)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setNewPost({...newPost, midia_url: url});
                    }
                  }}
                  className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/80
                    file:cursor-pointer cursor-pointer"
                />
              </div>
              <Button onClick={handleCreatePost} className="w-full bg-gradient-primary hover:opacity-90">
                Publicar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feed de publicações */}
      <div className="space-y-6">
        {publicacoes.map((publicacao) => (
          <div key={publicacao.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Header da publicação */}
            <div className="flex items-center gap-3 p-4">
              <div 
                className="w-12 h-12 rounded-full bg-gradient-secondary overflow-hidden cursor-pointer"
                onClick={() => handleViewProfile(publicacao.user_id)}
              >
                {publicacao.profiles?.avatar_url ? (
                  <img src={publicacao.profiles.avatar_url} alt={publicacao.profiles.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {publicacao.profiles?.display_name?.[0] || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p 
                    className="font-semibold text-white cursor-pointer hover:text-primary"
                    onClick={() => handleViewProfile(publicacao.user_id)}
                  >
                    {publicacao.profiles?.display_name || 'Usuário'}
                  </p>
                  {publicacao.profiles?.tipo_assinatura === 'premium' && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(publicacao.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              
              {/* Photo Grid */}
              <div className="ml-2">
                <PhotoGrid userId={publicacao.user_id} className="w-20" />
              </div>
            </div>

            {/* Conteúdo da publicação */}
            {publicacao.descricao && (
              <div className="px-4 pb-3">
                <p className="text-white">{publicacao.descricao}</p>
              </div>
            )}

            {/* Mídia */}
            {publicacao.midia_url && (
              <div className="w-full">
                {publicacao.tipo_midia === 'video' ? (
                  <video 
                    src={publicacao.midia_url} 
                    controls 
                    className="w-full max-h-96 object-cover"
                  />
                ) : (
                  <img 
                    src={publicacao.midia_url} 
                    alt="Publicação" 
                    className="w-full max-h-96 object-cover"
                  />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleLike(publicacao.id)}
                  className={`text-gray-400 hover:text-red-500 hover:bg-white/10 ${
                    userLikes.has(publicacao.id) ? 'text-red-500' : ''
                  }`}
                >
                  <Heart className={`w-5 h-5 mr-2 ${userLikes.has(publicacao.id) ? 'fill-current' : ''}`} />
                  {publicacao.curtidas_count}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleComments(publicacao.id)}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {publicacao.comentarios_count}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewProfile(publicacao.user_id)}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <User className="w-5 h-5 mr-2" />
                  Ver Perfil
                </Button>
              </div>

              {/* Comentários */}
              {showComments[publicacao.id] && (
                <div className="space-y-3 mt-4">
                  {comentarios[publicacao.id]?.map((comentario) => (
                    <div key={comentario.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-secondary overflow-hidden">
                        {comentario.profiles?.avatar_url ? (
                          <img src={comentario.profiles.avatar_url} alt={comentario.profiles.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                            {comentario.profiles?.display_name?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">
                          <span className="font-semibold">{comentario.profiles?.display_name || 'Usuário'}</span>
                          {' '}
                          {comentario.comentario}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(comentario.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar comentário */}
              <div className="flex items-center gap-3 mt-4">
                <div className="w-8 h-8 rounded-full bg-gradient-secondary overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                      {profile?.display_name?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder={isPremium ? "Adicione um comentário..." : "Seja Premium para comentar"}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={!isPremium}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleComment(publicacao.id)}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleComment(publicacao.id)}
                    disabled={!isPremium || !newComment.trim()}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {!isPremium && (
                <div className="mt-3 p-3 bg-gradient-primary/20 rounded-lg border border-primary/30">
                  <p className="text-sm text-primary">
                    ⭐ Seja Premium para curtir e comentar publicações! 
                    <Button 
                      variant="link" 
                      className="text-primary underline p-0 ml-1 h-auto"
                      onClick={() => navigate('/premium')}
                    >
                      Faça upgrade
                    </Button>
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {publicacoes.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma publicação encontrada</p>
          <p className="text-sm">Seja o primeiro a publicar algo!</p>
        </div>
      )}
    </div>
  );
};
