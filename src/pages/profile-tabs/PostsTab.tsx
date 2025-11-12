import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Edit, Trash2 } from "lucide-react";
import { BlurredMedia } from "@/components/ui/blurred-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserPost {
  id: string;
  descricao?: string;
  midia_url?: string;
  tipo_midia: string;
  created_at: string;
  curtidas_count: number;
  comentarios_count: number;
}

const PostsTab = () => {
  const { profile, isPremium } = useProfile();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<UserPost | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ descricao: "", midia_url: "", tipo_midia: "texto" as "texto" | "imagem" | "video" });
  const [deletingPost, setDeletingPost] = useState<UserPost | null>(null);

  const load = async () => {
      if (!profile?.user_id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('publicacoes')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false });
        if (!error) setPosts(data || []);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    load();
  }, [profile?.user_id]);

  const canManage = (post: UserPost) => profile?.user_id && true; // PostsTab lista posts do próprio usuário

  const openEdit = (post: UserPost) => {
    setEditingPost(post);
    setEditData({
      descricao: post.descricao || "",
      midia_url: post.midia_url || "",
      tipo_midia: (post.tipo_midia as any) || "texto",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editingPost) return;
    await supabase
      .from('publicacoes')
      .update({
        descricao: editData.descricao || null,
        midia_url: editData.midia_url || null,
        tipo_midia: editData.tipo_midia,
      })
      .eq('id', editingPost.id);
    setEditOpen(false);
    setEditingPost(null);
    await load();
  };

  const confirmDelete = (post: UserPost) => {
    setDeletingPost(post);
  };

  const deletePost = async () => {
    if (!deletingPost) return;
    await supabase
      .from('publicacoes')
      .delete()
      .eq('id', deletingPost.id);
    setDeletingPost(null);
    await load();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardHeader>
          <CardTitle className="text-white">Minhas Publicações ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Você ainda não fez nenhuma publicação</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {posts.map((post) => (
                <Card key={post.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    {post.midia_url && (
                      <div className="aspect-square rounded-lg overflow-hidden mb-3">
                        <BlurredMedia
                          src={post.midia_url}
                          alt="Post"
                          type={post.tipo_midia === 'video' ? 'video' : 'image'}
                          isPremium={isPremium}
                          className="w-full h-full"
                        />
                      </div>
                    )}
                    {post.descricao && (
                      <p className="text-white mb-3 text-xs sm:text-sm line-clamp-3">{post.descricao}</p>
                    )}
                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                      <span className="text-xs">
                        {new Date(post.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      {canManage(post) && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => openEdit(post)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 px-2" onClick={() => confirmDelete(post)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Publicação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm text-gray-300">Legenda</label>
            <Textarea
              value={editData.descricao}
              onChange={(e) => setEditData((d) => ({ ...d, descricao: e.target.value }))}
              placeholder="Escreva a legenda..."
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
            />
            <label className="text-sm text-gray-300">URL da mídia (imagem ou vídeo)</label>
            <Input
              value={editData.midia_url}
              onChange={(e) => setEditData((d) => ({ ...d, midia_url: e.target.value }))}
              placeholder="https://..."
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
            />
            <label className="text-sm text-gray-300">Tipo de mídia</label>
            <div className="flex gap-2">
              {(["texto", "imagem", "video"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={editData.tipo_midia === t ? "default" : "outline"}
                  onClick={() => setEditData((d) => ({ ...d, tipo_midia: t }))}
                  className={editData.tipo_midia === t ? "bg-primary text-white" : "border-white/20 text-white"}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPost} onOpenChange={(open) => !open && setDeletingPost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A publicação será removida definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deletePost}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostsTab;
