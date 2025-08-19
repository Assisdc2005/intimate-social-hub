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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const { profile } = useProfile();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    // Validate file count (max 5 files)
    if (selectedFiles.length + files.length > 5) {
      toast({
        title: "Muitos arquivos",
        description: "Você pode selecionar no máximo 5 mídias por publicação",
        variant: "destructive",
      });
      return;
    }

    // Validate files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `${file.name}: Apenas imagens e vídeos são permitidos`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name}: O arquivo deve ter no máximo 10MB`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push(e.target?.result as string);
        if (previews.length === validFiles.length) {
          setMediaPreviews([...mediaPreviews, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    }

    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setMediaPreviews(newPreviews);
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
    if (!content.trim() && selectedFiles.length === 0) {
      toast({
        title: "Conteúdo obrigatório",
        description: "Adicione um texto ou uma mídia para publicar",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Criar a publicação primeiro
      const { data: publicacao, error: publicacaoError } = await supabase
        .from('publicacoes')
        .insert({
          user_id: profile?.user_id,
          descricao: content.trim(),
          tipo_midia: selectedFiles.length > 0 ? 'multipla' : 'texto'
        })
        .select('id')
        .single();

      if (publicacaoError) throw publicacaoError;

      // Upload e inserir mídias se existirem
      if (selectedFiles.length > 0) {
        const mediaUploads = selectedFiles.map(async (file, index) => {
          const uploadedUrl = await uploadFile(file);
          if (!uploadedUrl) {
            throw new Error(`Erro no upload da mídia ${index + 1}`);
          }

          return supabase
            .from('publicacao_midias')
            .insert({
              publicacao_id: publicacao.id,
              midia_url: uploadedUrl,
              tipo_midia: file.type.startsWith('video/') ? 'video' : 'imagem',
              ordem: index
            });
        });

        const results = await Promise.all(mediaUploads);
        
        for (const result of results) {
          if (result.error) throw result.error;
        }
      }

      toast({
        title: "Publicação criada!",
        description: "Sua publicação foi criada com sucesso",
      });

      // Reset form
      setContent('');
      setSelectedFiles([]);
      setMediaPreviews([]);
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

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Mídias selecionadas ({mediaPreviews.length}/5)
              </div>
              <div className="grid grid-cols-2 gap-3">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    {selectedFiles[index]?.type.startsWith('video/') ? (
                      <video 
                        src={preview} 
                        controls 
                        className="w-full rounded-lg h-32 object-cover"
                      />
                    ) : (
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full rounded-lg h-32 object-cover"
                      />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                type="file"
                accept="image/*"
                multiple
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
                multiple
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
            disabled={uploading || (!content.trim() && selectedFiles.length === 0)}
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