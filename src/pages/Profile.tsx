import { User, MapPin, Calendar, Heart, Edit, Settings, Camera, Star, Shield, Crown, ArrowLeft, MessageCircle, Send, Play, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'texto' | 'imagem' | 'video';
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  user_liked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

export const Profile = () => {
  const { profile, isPremium, updateProfile } = useProfile();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [postComments, setPostComments] = useState<{ [key: string]: Comment[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch user's posts
  const fetchUserPosts = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user posts:', error);
        return;
      }

      // Check which posts the user has liked
      const postsWithLikes = await Promise.all(
        (data || []).map(async (post) => {
          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .single();

          return {
            ...post,
            user_liked: !!likeData
          };
        })
      );

      setPosts(postsWithLikes);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, [user?.id]);

  const handleLike = async (postId: string) => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o Premium para curtir publicações!",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.user_liked) {
        // Remove like
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, user_liked: false, likes_count: p.likes_count - 1 }
            : p
        ));
      } else {
        // Add like
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });

        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, user_liked: true, likes_count: p.likes_count + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o Premium para comentar!",
        variant: "destructive"
      });
      return;
    }

    const comment = newComment[postId]?.trim();
    if (!comment || !user?.id) return;

    try {
      await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: comment
        });

      setNewComment(prev => ({ ...prev, [postId]: '' }));
      
      // Refresh comments
      fetchComments(postId);
      
      // Update posts count
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));

      toast({
        title: "Comentário adicionado!",
        description: "Seu comentário foi publicado com sucesso.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      // First get comments
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      // Then get profile data for each comment
      const commentsWithProfiles = await Promise.all(
        (comments || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profile || { display_name: 'Usuário', avatar_url: null }
          };
        })
      );

      setPostComments(prev => ({ ...prev, [postId]: commentsWithProfiles }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleComments = (postId: string) => {
    const isShowing = showComments[postId];
    setShowComments(prev => ({ ...prev, [postId]: !isShowing }));
    
    if (!isShowing && !postComments[postId]) {
      fetchComments(postId);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath && oldPath.includes(user.id)) {
          await supabase.storage
            .from('fotos_perfil')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos_perfil')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Erro ao fazer upload da imagem');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('fotos_perfil')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const result = await updateProfile({ avatar_url: publicUrl });
      
      if (result.error) {
        throw new Error('Erro ao atualizar perfil');
      }

      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar foto de perfil",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-foreground text-lg">Carregando perfil...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4 pt-20">
      {/* Back Button - Fixed Position Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <Button 
          onClick={() => navigate('/home')}
          variant="ghost" 
          size="sm"
          className="text-white hover:text-white hover:bg-white/20 p-3 rounded-full backdrop-blur-sm bg-black/30 border border-white/20 animate-fade-in"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header do Perfil */}
        <Card className="glass backdrop-blur-xl border-primary/20 shadow-[var(--shadow-premium)]">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold text-4xl shadow-[var(--shadow-glow)] border-4 border-primary/20">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    profile.display_name[0]?.toUpperCase()
                  )}
                </div>
                
                {/* Status Premium */}
                {isPremium && (
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-[var(--shadow-glow)]">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                )}
                
                {/* Botão de editar foto */}
                <Button 
                  size="sm" 
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Camera className={`w-4 h-4 ${uploadingAvatar ? 'animate-pulse' : ''}`} />
                </Button>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {/* Informações Principais */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{profile.display_name}</h1>
                  {isPremium && (
                    <Badge className="bg-gradient-primary text-white border-0">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground mb-4">
                  {profile.birth_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{calculateAge(profile.birth_date)} anos</span>
                    </div>
                  )}
                  {(profile.city || profile.state) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.city}{profile.city && profile.state && ', '}{profile.state}</span>
                    </div>
                  )}
                  {profile.profession && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{profile.profession}</span>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-foreground/80 mb-4 max-w-md">{profile.bio}</p>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Button 
                    onClick={() => navigate('/complete-profile')}
                    className="bg-gradient-primary hover:opacity-90 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                  <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Informações */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Informações Pessoais */}
          <Card className="glass backdrop-blur-xl border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informações Pessoais
              </h3>
              
              <div className="space-y-3">
                {profile.gender && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gênero:</span>
                    <span className="text-foreground font-medium">{profile.gender}</span>
                  </div>
                )}
                {profile.sexual_orientation && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orientação:</span>
                    <span className="text-foreground font-medium">{profile.sexual_orientation}</span>
                  </div>
                )}
                {profile.relationship_status && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-foreground font-medium">{profile.relationship_status}</span>
                  </div>
                )}
                {profile.height && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Altura:</span>
                    <span className="text-foreground font-medium">{profile.height} cm</span>
                  </div>
                )}
                {profile.weight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peso:</span>
                    <span className="text-foreground font-medium">{profile.weight} kg</span>
                  </div>
                )}
                {profile.body_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo físico:</span>
                    <span className="text-foreground font-medium">{profile.body_type}</span>
                  </div>
                )}
                {profile.ethnicity && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Etnia:</span>
                    <span className="text-foreground font-medium">{profile.ethnicity}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estilo de Vida */}
          <Card className="glass backdrop-blur-xl border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Estilo de Vida
              </h3>
              
              <div className="space-y-3">
                {profile.looking_for && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Procurando por:</span>
                    <span className="text-foreground font-medium">{profile.looking_for}</span>
                  </div>
                )}
                {profile.objectives && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Objetivos:</span>
                    <span className="text-foreground font-medium">{profile.objectives}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fuma:</span>
                  <span className="text-foreground font-medium">{profile.smokes ? 'Sim' : 'Não'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bebe:</span>
                  <span className="text-foreground font-medium">{profile.drinks ? 'Sim' : 'Não'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interesses */}
        {profile.interests && profile.interests.length > 0 && (
          <Card className="glass backdrop-blur-xl border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Interesses
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status da Assinatura */}
        <Card className="glass backdrop-blur-xl border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Status da Conta
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">
                  Plano: {isPremium ? 'Premium' : 'Gratuito'}
                </p>
                {isPremium && profile.subscription_expires_at && (
                  <p className="text-sm text-muted-foreground">
                    Válido até: {new Date(profile.subscription_expires_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              
              {!isPremium && (
                <Button className="bg-gradient-primary hover:opacity-90 text-white">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Premium
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Minhas Publicações */}
        <Card className="glass backdrop-blur-xl border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Minhas Publicações
            </h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Você ainda não fez nenhuma publicação.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="border border-primary/20 rounded-lg p-4 bg-background/50">
                    {/* Post Content */}
                    {post.content && (
                      <p className="text-foreground mb-3">{post.content}</p>
                    )}
                    
                    {/* Post Media */}
                    {post.media_url && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative cursor-pointer group mb-3">
                            {post.media_type === 'video' ? (
                              <div className="relative">
                                <video 
                                  src={post.media_url}
                                  className="w-full h-64 object-cover rounded-lg"
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors rounded-lg">
                                  <Play className="w-12 h-12 text-white" />
                                </div>
                              </div>
                            ) : (
                              <img 
                                src={post.media_url}
                                alt="Post"
                                className="w-full h-64 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                              />
                            )}
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
                          {post.media_type === 'video' ? (
                            <video 
                              src={post.media_url}
                              controls
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <img 
                              src={post.media_url}
                              alt="Post"
                              className="w-full h-full object-contain"
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-2 ${
                            post.user_liked 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-muted-foreground hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-current' : ''}`} />
                          <span>{post.likes_count}</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments_count}</span>
                        </Button>
                      </div>
                      
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {/* Comments Section */}
                    {showComments[post.id] && (
                      <div className="border-t border-primary/20 pt-3 space-y-3">
                        {/* Comment Input */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Adicione um comentário..."
                            value={newComment[post.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ 
                              ...prev, 
                              [post.id]: e.target.value 
                            }))}
                            onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleComment(post.id)}
                            disabled={!newComment[post.id]?.trim()}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {postComments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-2 text-sm">
                              <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs flex-shrink-0">
                                {comment.profiles.avatar_url ? (
                                  <img 
                                    src={comment.profiles.avatar_url}
                                    alt={comment.profiles.display_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  comment.profiles.display_name[0]?.toUpperCase()
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{comment.profiles.display_name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <p className="text-foreground/80">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="glass backdrop-blur-xl border-red-500/20">
          <CardContent className="p-6">
            <Button 
              onClick={handleSignOut}
              variant="outline" 
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
            >
              Sair da Conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
