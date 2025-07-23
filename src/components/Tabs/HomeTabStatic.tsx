import { Camera, Heart, MessageCircle, MapPin, Clock, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

export const HomeTab = () => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Fetch data from database
  useEffect(() => {
    if (profile?.user_id) {
      fetchData();
      fetchUserLikes();
      
      // Set up real-time subscription for posts
      const channel = supabase
        .channel('posts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts'
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.user_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent posts with profile data
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            city
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch top premium users
      const { data: topUsersData } = await supabase
        .from('profiles')
        .select('*')
        .eq('subscription_type', 'premium')
        .limit(5);

      // Fetch recent notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles:from_user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', profile?.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      setPosts(postsData || []);
      setTopUsers(topUsersData || []);
      setRecentActivities(notificationsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!profile?.user_id) return;
    
    try {
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', profile.user_id);
      
      const likedPosts = new Set(likesData?.map(like => like.post_id) || []);
      setUserLikes(likedPosts);
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.user_id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts-media')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('posts-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleCreatePost = async () => {
    if (!profile?.user_id || (!newPostContent.trim() && !selectedFile)) {
      toast({
        title: "Erro",
        description: "Por favor, adicione conteúdo ou uma mídia para a publicação.",
        variant: "destructive",
      });
      return;
    }

    try {
      let mediaUrl = null;
      let mediaType = 'texto';

      if (selectedFile) {
        mediaUrl = await uploadFile(selectedFile);
        if (!mediaUrl) {
          toast({
            title: "Erro",
            description: "Erro ao fazer upload da mídia.",
            variant: "destructive",
          });
          return;
        }
        mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'foto';
      }

      const { error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: profile.user_id,
            content: newPostContent.trim() || null,
            media_url: mediaUrl,
            media_type: mediaType as any
          }
        ]);

      if (error) {
        console.error('Error creating post:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar publicação.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso!",
        description: "Publicação criada com sucesso.",
      });

      // Reset form
      setNewPostContent("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setCreatePostOpen(false);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar publicação.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (postId: string) => {
    if (!profile?.user_id) return;

    try {
      if (userLikes.has(postId)) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', profile.user_id);

        if (!error) {
          setUserLikes(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              post_id: postId,
              user_id: profile.user_id
            }
          ]);

        if (!error) {
          setUserLikes(prev => new Set([...prev, postId]));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const checkPremiumFeature = (action: string) => {
    if (profile?.tipo_assinatura !== 'premium') {
      toast({
        title: "Recurso Premium",
        description: `Para ${action}, você precisa ser um membro premium.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
      <div className="space-y-6 animate-fade-in">
      {/* Bloco Inicial - Hero Section */}
      <div className="glass rounded-3xl p-6 text-center space-y-4">
        <h2 className="text-2xl font-display font-bold text-gradient">
          Encontre pessoas Casadas e Solteiras
        </h2>
        <p className="text-lg text-foreground/90">
          na maior rede social adulta do Brasil.
        </p>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4" />
          {topUsers.length * 1000 + 838} mil de pessoas reais perto de você
        </p>
        
        <div className="flex gap-3">
          <Button className="btn-premium flex-1 text-lg py-4">
            Descobrir Perfis
          </Button>
          <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background/95 backdrop-blur border-white/20">
              <DialogHeader>
                <DialogTitle>Criar Publicação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="O que você está pensando?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="bg-input/50 border-white/20"
                />
                
                <div className="space-y-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition-colors">
                      <Upload className="w-5 h-5" />
                      <span>Adicionar foto ou vídeo</span>
                    </div>
                  </label>
                  
                  {previewUrl && (
                    <div className="relative rounded-lg overflow-hidden">
                      {selectedFile?.type.startsWith('video/') ? (
                        <video
                          src={previewUrl}
                          controls
                          className="w-full max-h-64 object-cover"
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full max-h-64 object-cover"
                        />
                      )}
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={handleCreatePost}
                  className="w-full btn-premium"
                  disabled={!newPostContent.trim() && !selectedFile}
                >
                  Publicar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Ranking Top Sensuais Online */}
      <div className="card-premium">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gradient">Top Sensuais Online</h3>
        </div>
        
        <div className="space-y-3">
          {topUsers.length > 0 ? topUsers.map((user, index) => (
            <div key={user.id} className="flex items-center justify-between p-3 rounded-xl glass hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold">
                      {user.display_name?.[0] || 'U'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div>
                  <p className="font-medium">{user.display_name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {user.city || 'Brasil'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-accent">#{index + 1}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20"
                  onClick={() => checkPremiumFeature('curtir perfis')}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhum usuário premium encontrado
            </p>
          )}
        </div>
      </div>

      {/* Sessão Últimas Fotos */}
      <div className="card-premium">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gradient">Últimas Fotos</h3>
          </div>
          <Button variant="ghost" className="text-accent hover:text-accent/80">
            Mais fotos →
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {posts.filter(post => post.media_url).slice(0, 4).map((post) => (
            <div key={post.id} className="relative group cursor-pointer">
              <div className="aspect-[3/4] rounded-2xl bg-gradient-secondary overflow-hidden">
                {post.media_type === 'video' ? (
                  <video
                    src={post.media_url}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    muted
                  />
                ) : (
                  <img 
                    src={post.media_url}
                    alt={`Post de ${post.profiles?.display_name}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                )}
                
                {/* Overlay com informações */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-medium text-white">{post.profiles?.display_name}</p>
                    <p className="text-xs text-white/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.profiles?.city || 'Brasil'}
                    </p>
                    {post.content && (
                      <p className="text-xs text-white/90 mt-1 line-clamp-2">{post.content}</p>
                    )}
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button 
                    size="sm" 
                    className={`w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 border-0 ${
                      userLikes.has(post.id) ? 'text-red-500' : 'text-white'
                    }`}
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart className="w-4 h-4" fill={userLikes.has(post.id) ? "currentColor" : "none"} />
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 border-0"
                    onClick={() => checkPremiumFeature('comentar')}
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                  </Button>
                </div>
                
                {/* Contador de curtidas */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-black/50 rounded-full px-2 py-1">
                    <span className="text-xs text-white flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likes_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {posts.filter(post => post.media_url).length === 0 && (
            <div className="col-span-full text-center py-8">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma foto publicada ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Feed de Atividades Recentes */}
      <div className="card-premium">
        <h3 className="text-lg font-semibold text-gradient mb-4">Atividade Recente</h3>
        
        <div className="space-y-4">
          {recentActivities.length > 0 ? recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl glass">
              <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold">
                {activity.profiles?.display_name?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.profiles?.display_name || 'Usuário'}</span>{' '}
                  {activity.type === 'curtida' && 'curtiu sua publicação'}
                  {activity.type === 'comentario' && 'comentou na sua publicação'}
                  {activity.type === 'visita' && 'visitou seu perfil'}
                  {activity.type === 'novo_amigo' && 'enviou uma solicitação de amizade'}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {activity.type === 'curtida' && <Heart className="w-5 h-5 text-accent" />}
              {activity.type === 'comentario' && <MessageCircle className="w-5 h-5 text-accent" />}
              {activity.type === 'visita' && <div className="w-5 h-5 rounded-full bg-accent" />}
              {activity.type === 'novo_amigo' && <div className="w-5 h-5 rounded-full bg-green-500" />}
            </div>
          )) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma atividade recente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
