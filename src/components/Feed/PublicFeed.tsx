import { useState, useEffect } from "react";
import { Heart, MessageCircle, Plus, Send, User, Clock, Crown, Trash2, Edit2, Lock, ArrowLeft } from "lucide-react";
import { PhotoGrid } from "@/components/Profile/PhotoGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreatePostModal } from "@/components/Modals/CreatePostModal";
import { PremiumContentModal } from "@/components/Modals/PremiumContentModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BlurredMedia } from "@/components/ui/blurred-media";
import { uploadOriginalAndGenerateWatermark } from "@/lib/watermark";
import UserPhotoCard from "@/components/media/UserPhotoCard";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PublicacaoCarrossel } from "./PublicacaoCarrossel";
import { useAdmin } from "@/hooks/useAdmin";

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
  const { isAdmin } = useAdmin();

  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ descricao: '', midia_url: '' });
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [comentarios, setComentarios] = useState<{ [key: string]: Comentario[] }>({});
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<{ [id: string]: boolean }>({});
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [reactionMenuPost, setReactionMenuPost] = useState<string | null>(null);
  const [userReactions, setUserReactions] = useState<Record<string, 'hot' | 'desire' | 'flirty' | 'kiss' | null>>({});
  const [reactionStats, setReactionStats] = useState<Record<string, { hot: number; desire: number; flirty: number; kiss: number }>>({});
  const [userLikeCount, setUserLikeCount] = useState<number>(0);
  const [userCommentCount, setUserCommentCount] = useState<number>(0);
  const MAX_TEXT = 190;
  const FREE_POSTS_LIMIT = 5; // Primeiras 5 publicações gratuitas

  const [selectedMedia, setSelectedMedia] = useState<{ url: string; tipo: 'image' | 'video' } | null>(null);
  const [scrollPosition, setScrollPosition] = useState<number | null>(null);

  const openMediaModal = (media: { url: string; tipo: 'image' | 'video' }) => {
    const currentScroll = window.scrollY || window.pageYOffset;
    setScrollPosition(currentScroll);
    document.body.style.overflow = 'hidden';
    setSelectedMedia(media);
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
    document.body.style.overflow = '';
    if (scrollPosition !== null) {
      window.scrollTo({ top: scrollPosition, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const getReactionEmoji = (r?: 'hot' | 'desire' | 'flirty' | 'kiss' | null) => {
    switch (r) {
      case 'hot': return '🔥';
      case 'desire': return '🤤';
      case 'flirty': return '😏';
      case 'kiss': return '💋';
      default: return null;
    }
  };

  const getDominantReaction = (postId: string): 'hot' | 'desire' | 'flirty' | 'kiss' | null => {
    const stats = reactionStats[postId];
    if (!stats) return null;
    const entries: Array<["hot"|"desire"|"flirty"|"kiss", number]> = [
      ['hot', stats.hot || 0],
      ['desire', stats.desire || 0],
      ['flirty', stats.flirty || 0],
      ['kiss', stats.kiss || 0],
    ];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][1] > 0 ? entries[0][0] : null;
  };

  const fetchReactionStats = async (postIds: string[]) => {
    if (!postIds.length) return;
    try {
      const { data, error } = await supabase
        .from('curtidas_publicacoes')
        .select('publicacao_id, reaction')
        .in('publicacao_id', postIds);
      if (error) throw error;
      const rows = (data as any[]) || [];
      const acc: Record<string, { hot: number; desire: number; flirty: number; kiss: number }> = {};
      for (const r of rows) {
        const pid = r.publicacao_id as string;
        const rx = r.reaction as 'hot' | 'desire' | 'flirty' | 'kiss' | null;
        if (!acc[pid]) acc[pid] = { hot: 0, desire: 0, flirty: 0, kiss: 0 };
        if (rx && acc[pid][rx] !== undefined) acc[pid][rx] += 1;
      }
      setReactionStats((prev) => ({ ...prev, ...acc }));
    } catch (e) {
      console.error('Erro ao buscar estatísticas de reações:', e);
    }
  };

  useEffect(() => {
    if (!profile?.user_id) return;
    
    // Execute all initial fetches in parallel
    Promise.all([
      fetchPublicacoes(),
      fetchUserLikes(),
      fetchUserCommentsCount()
    ]);

    // Set up real-time subscription
    const channel = supabase
      .channel('publicacoes_feed')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'publicacoes' },
        () => {
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

  // Check if the current user can create a new post.
  // Premium: unlimited. Non-premium: allow at most 1 post.
  const canCreatePost = async (): Promise<boolean> => {
    if (isPremium) return true;
    if (!profile?.user_id) return false;

    const { count, error } = await supabase
      .from('publicacoes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.user_id);

    if (error) {
      console.error('Erro ao verificar limite de publicações:', error);
      return false;
    }

    // Non-premium users may create 1 post total
    return (count || 0) < 1;
  };

  // Intercept dialog open to enforce gating
  const handleOpenCreateDialog = async (open: boolean) => {
    if (open) {
      const allowed = await canCreatePost();
      if (!allowed) {
        toast({
          title: 'Recurso Premium',
          description: 'Usuários gratuitos podem criar apenas 1 publicação. Torne-se Premium para liberar publicações ilimitadas.',
          variant: 'destructive',
        });
        return;
      }
      setShowCreatePost(true);
    } else {
      setShowCreatePost(false);
    }
  };

  const fetchPublicacoes = async (offset = 0) => {
    try {
      // Execute all queries in parallel for better performance
      const publicacoesQuery = supabase
        .from('publicacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + 19);

      const [{ data: publicacoesData, error: publicacoesError }] = await Promise.all([publicacoesQuery]);

      if (publicacoesError) throw publicacoesError;

      if (!publicacoesData || publicacoesData.length === 0) {
        if (offset === 0) setPublicacoes([]);
        if (publicacoesData?.length < 20) setHasMore(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(publicacoesData.map(pub => pub.user_id))];
      
      // Fetch profiles and user reactions in parallel
      const [{ data: profilesData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, city, state, tipo_assinatura')
          .in('user_id', userIds)
      ]);

      // Combine data
      const publicacoesWithProfiles = publicacoesData.map(pub => ({
        ...pub,
        profiles: profilesData?.find(profile => profile.user_id === pub.user_id)
      }));

      // Filter out posts from deleted users or placeholder profiles
      const filteredPublicacoes = publicacoesWithProfiles.filter((p) => {
        const dn = p.profiles?.display_name?.trim();
        if (!p.profiles) return false;
        if (!dn) return false;
        // Exclude generic placeholder names like 'Usuário'
        return dn.toLowerCase() !== 'usuário' && dn.toLowerCase() !== 'usuario';
      });

      if (offset === 0) {
        setPublicacoes(filteredPublicacoes);
      } else {
        setPublicacoes(prev => [...prev, ...filteredPublicacoes]);
      }

      // Load reaction stats asynchronously (non-blocking)
      const pageIds = publicacoesWithProfiles.map((p) => p.id);
      setTimeout(() => {
        fetchReactionStats(pageIds);
      }, 0);

      // Check if there are more posts
      if (publicacoesWithProfiles.length < 20) {
        setHasMore(false);
      }
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
        .select('publicacao_id, reaction')
        .eq('user_id', profile.user_id);

      const rows = (data as any[]) || [];
      setUserLikes(new Set(rows.map((like: any) => like.publicacao_id)));
      setUserLikeCount(rows.length || 0);
      const map: Record<string, 'hot' | 'desire' | 'flirty' | 'kiss' | null> = {};
      for (const row of rows) {
        map[row.publicacao_id] = (row.reaction as any) ?? null;
      }
      setUserReactions(map);
    } catch (error) {
      console.error('Erro ao buscar curtidas:', error);
    }
  };

  const fetchUserCommentsCount = async () => {
    if (!profile?.user_id) return;
    try {
      const { count, error } = await supabase
        .from('comentarios_publicacoes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.user_id);
      if (!error) setUserCommentCount(count || 0);
    } catch (e) {
      console.error('Erro ao contar comentários do usuário:', e);
    }
  };

  const fetchComentarios = async (publicacaoId: string) => {
    try {
      // Execute both queries in parallel for better performance
      const [{ data: comentariosData }, { data: profilesData }] = await Promise.all([
        supabase
          .from('comentarios_publicacoes')
          .select('*')
          .eq('publicacao_id', publicacaoId)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
      ]);

      if (!comentariosData || comentariosData.length === 0) {
        setComentarios(prev => ({ ...prev, [publicacaoId]: [] }));
        return;
      }

      // Filter profiles to only those needed
      const userIds = new Set(comentariosData.map(com => com.user_id));
      const relevantProfiles = profilesData?.filter(p => userIds.has(p.user_id));

      // Combine data
      const comentariosWithProfiles = comentariosData.map(com => ({
        ...com,
        profiles: relevantProfiles?.find(profile => profile.user_id === com.user_id)
      }));

      setComentarios(prev => ({ ...prev, [publicacaoId]: comentariosWithProfiles }));
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      setComentarios(prev => ({ ...prev, [publicacaoId]: [] }));
    }
  };

  const handleCreatePost = async () => {
    // Double-check gating on submit
    const allowed = await canCreatePost();
    if (!allowed) {
      toast({
        title: 'Recurso Premium',
        description: 'Usuários gratuitos podem criar apenas 1 publicação. Torne-se Premium para liberar publicações ilimitadas.',
        variant: 'destructive',
      });
      return;
    }

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

      // Upload media if a file was selected
      if (newPost.midia_url && newPost.midia_url.startsWith('blob:')) {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const selectedFile = fileInput?.files?.[0];
        
        if (selectedFile) {
          mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'imagem';

          if (mediaType === 'imagem') {
            // Image: route through watermark pipeline
            const { data: wm, error: wmErr } = await uploadOriginalAndGenerateWatermark({
              file: selectedFile,
              userId: profile?.user_id || 'unknown',
            });
            if (wmErr || !wm) {
              throw new Error(wmErr || 'Falha ao marcar d\'água a imagem');
            }
            mediaUrl = wm.publicUrl;
          } else {
            // Video: keep previous direct upload path
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${profile?.user_id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from('publicacoes')
              .upload(fileName, selectedFile);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage
              .from('publicacoes')
              .getPublicUrl(fileName);
            mediaUrl = publicUrl;
          }
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

  const handleLike = async (publicacaoId: string, index: number) => {
    // Verificar se a publicação está bloqueada (index >= 5 e não é premium)
    if (!isPremium && index >= FREE_POSTS_LIMIT) {
      setShowPremiumModal(true);
      return;
    }

    if (!isPremium) {
      const alreadyLikedThisPost = userLikes.has(publicacaoId);
      // Permite alterar reação na mesma publicação; bloqueia segunda curtida em outra publicação
      if (!alreadyLikedThisPost && userLikeCount >= 1) {
        setShowPremiumModal(true);
        return;
      }
      toast({
        title: "Seja Premium para curtir publicações",
        description: "Faça upgrade para o Premium e libere curtidas ilimitadas",
        variant: "destructive",
      });
      // Não retorna aqui, abre o popover para selecionar a reação da primeira curtida
    }
    // Abre o menu de reações
    setReactionMenuPost(publicacaoId);
  };

  const handleSelectReaction = async (
    publicacaoId: string,
    index: number,
    reaction: 'hot' | 'desire' | 'flirty' | 'kiss'
  ) => {
    try {
      const alreadyLiked = userLikes.has(publicacaoId);
      // Gating: se não premium e tentando reagir numa segunda publicação, bloquear
      if (!isPremium && !alreadyLiked && userLikeCount >= 1) {
        setShowPremiumModal(true);
        return;
      }

      const { error } = await supabase
        .from('curtidas_publicacoes')
        .upsert(
          [{ publicacao_id: publicacaoId, user_id: profile?.user_id, reaction }],
          { onConflict: 'user_id,publicacao_id' }
        );
      if (error) throw error;

      setUserLikes(prev => new Set([...prev, publicacaoId]));
      setUserReactions(prev => ({ ...prev, [publicacaoId]: reaction }));

      // Atualiza agregados locais (dominant reaction visível para todos)
      setReactionStats(prev => {
        const current = prev[publicacaoId] || { hot: 0, desire: 0, flirty: 0, kiss: 0 };
        const old = userReactions[publicacaoId];
        const next = { ...current };
        if (!alreadyLiked) {
          // primeira reação do usuário neste post
          next[reaction] = (next[reaction] || 0) + 1;
        } else if (old && old !== reaction) {
          // trocando reação: decrementa antiga e incrementa nova
          next[old] = Math.max(0, (next[old] || 0) - 1);
          next[reaction] = (next[reaction] || 0) + 1;
        }
        return { ...prev, [publicacaoId]: next };
      });

      // Atualiza contagem apenas se era a primeira reação
      if (!alreadyLiked) {
        setPublicacoes(prev => prev.map(pub => 
          pub.id === publicacaoId 
            ? { ...pub, curtidas_count: pub.curtidas_count + 1 }
            : pub
        ));
        setUserLikeCount((c) => c + 1);
      }
    } catch (e) {
      console.error('Erro ao reagir:', e);
      toast({ title: 'Erro', description: 'Não foi possível enviar sua reação', variant: 'destructive' });
    } finally {
      setReactionMenuPost(null);
    }
  };

  const handleComment = async (publicacaoId: string, index: number) => {
    // Verificar se a publicação está bloqueada (index >= 5 e não é premium)
    if (!isPremium && index >= FREE_POSTS_LIMIT) {
      setShowPremiumModal(true);
      return;
    }

    if (!isPremium) {
      // Gating: apenas 1 comentário no total para não-premium
      if (userCommentCount >= 1) {
        setShowPremiumModal(true);
        return;
      }
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
      setUserCommentCount((c) => c + 1);
      
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

  const toggleComments = (publicacaoId: string, index: number) => {
    // Verificar se a publicação está bloqueada (index >= 5 e não é premium)
    if (!isPremium && index >= FREE_POSTS_LIMIT) {
      setShowPremiumModal(true);
      return;
    }

    const isCurrentlyShown = showComments[publicacaoId];
    
    // Toggle UI immediately (non-blocking)
    setShowComments(prev => ({ ...prev, [publicacaoId]: !prev[publicacaoId] }));
    
    // Load comments asynchronously if opening and not loaded yet
    if (!isCurrentlyShown && !comentarios[publicacaoId]) {
      // Use setTimeout to prevent blocking the UI thread
      setTimeout(() => {
        fetchComentarios(publicacaoId);
      }, 0);
    }
  };

  const handleBlockedInteraction = () => {
    setShowPremiumModal(true);
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/view/${userId}`);
  };

  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    try {
      await fetchPublicacoes(publicacoes.length);
    } catch (error) {
      console.error('Erro ao carregar mais publicações:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleEditPost = (publicacaoId: string, descricao: string) => {
    setEditingPost(publicacaoId);
    setEditContent(descricao || '');
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    try {
      const { error } = await supabase
        .from('publicacoes')
        .update({ descricao: editContent })
        .eq('id', editingPost);

      if (error) throw error;

      setPublicacoes(prev => prev.map(pub => 
        pub.id === editingPost ? { ...pub, descricao: editContent } : pub
      ));

      toast({
        title: "Publicação atualizada!",
        description: "Sua publicação foi atualizada com sucesso",
      });

      setEditingPost(null);
      setEditContent('');
    } catch (error) {
      console.error('Erro ao editar publicação:', error);
      toast({
        title: "Erro",
        description: "Erro ao editar publicação",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;

    try {
      // Se admin, usar Edge Function para apagar storage e registros com privilégios
      if (isAdmin) {
        const { data: sessionData } = await supabase.auth.getSession();
        const jwt = sessionData.session?.access_token;
        const res = await fetch('/functions/v1/admin_delete_publicacao_with_media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          },
          body: JSON.stringify({ publicacaoId: deletePostId }),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Edge Function error: ${txt}`);
        }
      } else {
        // Fluxo original (dono do post) - deletar dependências e depois a publicação
        await supabase
          .from('publicacao_midias')
          .delete()
          .eq('publicacao_id', deletePostId);

        await supabase
          .from('curtidas_publicacoes')
          .delete()
          .eq('publicacao_id', deletePostId);

        await supabase
          .from('comentarios_publicacoes')
          .delete()
          .eq('publicacao_id', deletePostId);

        const { error } = await supabase
          .from('publicacoes')
          .delete()
          .eq('id', deletePostId);
        if (error) throw error;
      }

      setPublicacoes(prev => prev.filter(pub => pub.id !== deletePostId));

      toast({
        title: "Publicação excluída!",
        description: "Sua publicação foi excluída com sucesso",
      });

      setDeletePostId(null);
    } catch (error) {
      console.error('Erro ao deletar publicação:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar publicação",
        variant: "destructive",
      });
    }
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
        
        <Button
          className="bg-gradient-primary hover:opacity-90 text-white rounded-full px-6 py-2"
          onClick={() => handleOpenCreateDialog(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Criar Publicação
        </Button>
        <CreatePostModal
          isOpen={showCreatePost}
          onOpenChange={setShowCreatePost}
          onPostCreated={() => {
            setShowCreatePost(false);
            fetchPublicacoes();
          }}
        />
      </div>

      {/* Feed de publicações */}
      <div className="space-y-6">
        {publicacoes.map((publicacao, index) => {
          const isBlocked = !isPremium && index >= FREE_POSTS_LIMIT;
          
          return (
            <div 
              key={publicacao.id} 
              className={`bg-white/5 rounded-2xl border border-white/10 overflow-hidden relative ${
                isBlocked ? 'cursor-pointer' : ''
              }`}
              onClick={isBlocked ? handleBlockedInteraction : undefined}
            >
              {/* Overlay de bloqueio */}
              {isBlocked && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                  <div className="text-center space-y-3 p-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-glow animate-pulse">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Conteúdo Premium</h3>
                    <p className="text-white/80">Torne-se Premium para ver</p>
                  </div>
                </div>
              )}
              {/* Header da publicação */}
              <div className="flex items-center gap-3 p-4">
                <div 
                  className="w-12 h-12 rounded-full bg-gradient-secondary overflow-hidden cursor-pointer"
                  onClick={() => handleViewProfile(publicacao.user_id)}
                >
                  {publicacao.profiles?.avatar_url ? (
                    <img 
                      src={publicacao.profiles.avatar_url} 
                      alt={publicacao.profiles.display_name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                      key={publicacao.profiles.avatar_url}
                    />
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

                {/* Botões de editar e deletar (dono ou admin) */}
                {(profile?.user_id === publicacao.user_id || isAdmin) && (
                  <div className="flex items-center gap-2">
                    {profile?.user_id === publicacao.user_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditPost(publicacao.id, publicacao.descricao || '')}
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletePostId(publicacao.id)}
                      className="text-gray-400 hover:text-red-500 hover:bg-white/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Photo Grid */}
                <div className="ml-2">
                  <PhotoGrid userId={publicacao.user_id} className="w-20" />
                </div>
              </div>

              {/* Conteúdo da publicação */}
              {publicacao.descricao && (
                <div className="px-4 pb-3 space-y-1">
                  <p className="text-white">
                    {expandedPosts[publicacao.id] || publicacao.descricao.length <= MAX_TEXT
                      ? publicacao.descricao
                      : `${publicacao.descricao.slice(0, MAX_TEXT)}...`}
                  </p>
                  {publicacao.descricao.length > MAX_TEXT && (
                    <button
                      className="text-primary text-sm hover:underline"
                      onClick={() =>
                        setExpandedPosts((prev) => ({
                          ...prev,
                          [publicacao.id]: !prev[publicacao.id],
                        }))
                      }
                    >
                      {expandedPosts[publicacao.id] ? 'ver menos' : 'ver mais'}
                    </button>
                  )}
                </div>
              )}

              {/* Mídia (carrossel ou fallback para única mídia) */}
              <div className={isBlocked ? 'blur-lg pointer-events-none' : ''}>
                <PublicacaoCarrossel
                  publicacaoId={publicacao.id}
                  isPremium={isPremium || index < FREE_POSTS_LIMIT}
                  fallbackMidia={publicacao.midia_url ? {
                    url: publicacao.midia_url,
                    tipo: publicacao.tipo_midia === 'video' ? 'video' : 'image'
                  } : undefined}
                  onMediaClick={(media) => {
                    if (!isBlocked) {
                      openMediaModal(media);
                    }
                  }}
                />

                {/* Múltiplas Mídias - buscar da nova tabela */}
                {publicacao.tipo_midia === 'multipla' && (
                  <PublicacaoCarrossel
                    publicacaoId={publicacao.id}
                    isPremium={isPremium || index < FREE_POSTS_LIMIT}
                    onMediaClick={(media) => {
                      if (!isBlocked) {
                        openMediaModal(media);
                      }
                    }}
                  />
                )}
              </div>

              {/* Actions */}
              <div className={`px-4 pb-3 ${isBlocked ? 'blur-sm pointer-events-none' : ''}`}>
                <div className="flex items-center gap-4 mb-3">
                  <Popover 
                    open={reactionMenuPost === publicacao.id}
                    onOpenChange={(o) => {
                      if (o) {
                        if (!isPremium) {
                          setShowPremiumModal(true);
                          return;
                        }
                        setReactionMenuPost(publicacao.id);
                      } else {
                        setReactionMenuPost(null);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(publicacao.id, index);
                        }}
                        disabled={isBlocked}
                        className={`text-gray-400 hover:text-red-500 hover:bg-white/10 ${
                          userLikes.has(publicacao.id) ? 'text-red-500' : ''
                        }`}
                      >
                        {getReactionEmoji(userReactions[publicacao.id] ?? getDominantReaction(publicacao.id)) ? (
                          <span className="text-lg mr-2">{getReactionEmoji(userReactions[publicacao.id] ?? getDominantReaction(publicacao.id))}</span>
                        ) : (
                          <Heart className={`w-5 h-5 mr-2 ${userLikes.has(publicacao.id) ? 'fill-current' : ''}`} />
                        )}
                        {publicacao.curtidas_count}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" sideOffset={8} className="w-auto p-2 bg-background/95 backdrop-blur border-white/20 rounded-xl">
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          className="text-xl hover:scale-110 transition"
                          onClick={(e) => { e.stopPropagation(); handleSelectReaction(publicacao.id, index, 'hot'); }}
                          title="Foguinho"
                        >🔥</button>
                        <button
                          className="text-xl hover:scale-110 transition"
                          onClick={(e) => { e.stopPropagation(); handleSelectReaction(publicacao.id, index, 'desire'); }}
                          title="Babando"
                        >🤤</button>
                        <button
                          className="text-xl hover:scale-110 transition"
                          onClick={(e) => { e.stopPropagation(); handleSelectReaction(publicacao.id, index, 'flirty'); }}
                          title="Olhar safado"
                        >😏</button>
                        <button
                          className="text-xl hover:scale-110 transition"
                          onClick={(e) => { e.stopPropagation(); handleSelectReaction(publicacao.id, index, 'kiss'); }}
                          title="Beijo sexy"
                        >💋</button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComments(publicacao.id, index);
                    }}
                    disabled={isBlocked}
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {publicacao.comentarios_count}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProfile(publicacao.user_id);
                    }}
                    disabled={isBlocked}
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Ver Perfil
                  </Button>
                </div>
              </div>

              {/* Comentários */}
              {showComments[publicacao.id] && !isBlocked && (
                <div className="px-4 pb-4">
                  <div className="space-y-3 mt-4">
                    {comentarios[publicacao.id]?.map((comentario) => (
                      <div key={comentario.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-secondary overflow-hidden">
                          {comentario.profiles?.avatar_url ? (
                            <img src={comentario.profiles.avatar_url} alt={comentario.profiles.display_name} className="w-full h-full object-cover" loading="lazy" />
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

                  {/* Adicionar comentário */}
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-secondary overflow-hidden">
                        {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.display_name} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                          key={profile.avatar_url}
                        />
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
                        onKeyPress={(e) => e.key === 'Enter' && handleComment(publicacao.id, index)}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleComment(publicacao.id, index)}
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
              )}
            </div>
          );
        })}
      </div>

      {/* Ver mais button */}
      {hasMore && (
        <div className="flex justify-center py-6">
          <Button
            onClick={loadMorePosts}
            disabled={loadingMore}
            className="bg-gradient-primary hover:opacity-90 text-white px-8 py-3 rounded-xl"
          >
            {loadingMore ? 'Carregando...' : 'Ver mais publicações'}
          </Button>
        </div>
      )}

      {publicacoes.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma publicação encontrada</p>
          <p className="text-sm">Seja o primeiro a publicar algo!</p>
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="bg-background/95 backdrop-blur border-white/20">
          <DialogHeader>
            <DialogTitle className="text-gradient">Editar Publicação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Atualize sua publicação..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
              rows={4}
              maxLength={500}
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setEditingPost(null)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEdit}
                className="bg-gradient-primary hover:opacity-90"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Premium */}
      <PremiumContentModal 
        isOpen={showPremiumModal}
        onOpenChange={setShowPremiumModal}
      />

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent className="bg-background/95 backdrop-blur border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Publicação</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePost}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de visualização de mídia em tela cheia (responsivo, sem corte vertical) */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 md:z-[60] flex items-center justify-center bg-black/80"
          onClick={closeMediaModal}
        >
          <div
            className="relative w-full max-w-sm md:max-w-2xl max-h-[90vh] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeMediaModal}
              className="absolute -top-10 right-4 text-white/80 hover:text-white"
            >
              Fechar
            </button>

            <div className="w-full max-h-[80vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              {selectedMedia.tipo === 'video' ? (
                <BlurredMedia
                  src={selectedMedia.url}
                  alt="Mídia da publicação"
                  type="video"
                  isPremium={true}
                  controls={true}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="relative w-full flex items-center justify-center">
                  <img
                    src={selectedMedia.url}
                    alt="Mídia da publicação"
                    className="max-h-[80vh] max-w-full w-auto h-auto object-contain mx-auto rounded-2xl"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 grid place-items-center"
                  >
                    <span
                      className="opacity-25 text-white text-[6vw] md:text-3xl font-bold tracking-widest whitespace-nowrap select-none"
                      style={{
                        textShadow: '2px 2px 8px rgba(0,0,0,0.6)',
                        transform: 'rotate(-18deg)',
                      }}
                    >
                      Sensual Nexus
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};