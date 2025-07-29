import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Video, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

interface CreatePostModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: () => void;
}

export const CreatePostModal = ({ isOpen, onOpenChange, onPostCreated }: CreatePostModalProps) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const { profile } = useProfile();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Apenas imagens (JPG, PNG, GIF) e vídeos (MP4, WebM) são permitidos",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setMediaPreview(null);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `posts/${profile?.user_id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('posts-media')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('posts-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) {
      toast({
        title: "Conteúdo obrigatório",
        description: "Adicione um texto ou uma mídia para publicar",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      let mediaUrl = '';
      let mediaType = 'texto';

      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile);
        if (!uploadedUrl) {
          throw new Error('Erro no upload da mídia');
        }
        mediaUrl = uploadedUrl;
        mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'imagem';
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: profile?.user_id,
          content: content.trim(),
          media_type: mediaType as any,
          media_url: mediaUrl
        });

      if (error) throw error;

      toast({
        title: "Publicação criada!",
        description: "Sua publicação foi criada com sucesso",
      });

      // Reset form
      setContent('');
      setSelectedFile(null);
      setMediaPreview(null);
      onOpenChange(false);
      onPostCreated?.();

    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar publicação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass backdrop-blur-xl border-primary/20 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gradient">Criar Publicação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Text Content */}
          <div>
            <Label htmlFor="content" className="text-white">O que você está pensando?</Label>
            <Textarea
              id="content"
              placeholder="Compartilhe algo interessante..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="glass border-primary/30 text-white placeholder:text-gray-400 min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right mt-1">
              {content.length}/500
            </div>
          </div>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative">
              {selectedFile?.type.startsWith('video/') ? (
                <video 
                  src={mediaPreview} 
                  controls 
                  className="w-full rounded-lg max-h-80 object-cover"
                />
              ) : (
                <img 
                  src={mediaPreview} 
                  alt="Preview" 
                  className="w-full rounded-lg max-h-80 object-cover"
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={removeFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* File Upload */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <Label
                htmlFor="image-upload"
                className="flex items-center justify-center gap-2 p-3 border border-primary/30 rounded-lg cursor-pointer hover:bg-white/10 transition-colors glass"
              >
                <Camera className="h-4 w-4" />
                Foto
              </Label>
            </div>

            <div>
              <Input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="video-upload"
              />
              <Label
                htmlFor="video-upload"
                className="flex items-center justify-center gap-2 p-3 border border-primary/30 rounded-lg cursor-pointer hover:bg-white/10 transition-colors glass"
              >
                <Video className="h-4 w-4" />
                Vídeo
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={uploading || (!content.trim() && !selectedFile)}
            className="w-full bg-gradient-primary hover:opacity-90 text-white"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publicando...
              </div>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Publicar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};