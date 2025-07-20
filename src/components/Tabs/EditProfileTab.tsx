import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const EditProfileTab = () => {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    birth_date: '',
    gender: '',
    sexual_orientation: '',
    state: '',
    city: '',
    profession: '',
    height: '',
    weight: '',
    relationship_status: '',
    interests: [] as string[],
    smokes: false,
    drinks: false,
  });

  const [interestInput, setInterestInput] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        birth_date: profile.birth_date || '',
        gender: profile.gender || '',
        sexual_orientation: profile.sexual_orientation || '',
        state: profile.state || '',
        city: profile.city || '',
        profession: profile.profession || '',
        height: profile.height?.toString() || '',
        weight: profile.weight?.toString() || '',
        relationship_status: profile.relationship_status || '',
        interests: profile.interests || [],
        smokes: profile.smokes || false,
        drinks: profile.drinks || false,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const updates = {
        ...formData,
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
      };

      const result = await updateProfile(updates);
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso",
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.user_id) return;

    try {
      setSaving(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/avatar.${fileExt}`;
      
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('fotos_perfil')
            .remove([`${profile.user_id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos_perfil')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('fotos_perfil')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const result = await updateProfile({ avatar_url: publicUrl });
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso",
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar foto de perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interestInput.trim()]
      });
      setInterestInput('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-xl text-gradient">Editar Perfil</CardTitle>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Photo */}
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                formData.display_name[0]?.toUpperCase()
              )}
            </div>
            <Button
              size="icon"
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-primary hover:opacity-90"
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              <Camera className="w-4 h-4" />
            </Button>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Clique no ícone para alterar sua foto
          </p>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg text-gradient">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-foreground">Nome *</Label>
            <Input
              id="name"
              value={formData.display_name}
              onChange={(e) => setFormData({...formData, display_name: e.target.value})}
              className="glass border-primary/30 h-12 rounded-xl"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <Label htmlFor="bio" className="text-foreground">Biografia</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="glass border-primary/30 rounded-xl min-h-[100px]"
              placeholder="Conte um pouco sobre você..."
            />
          </div>

          <div>
            <Label htmlFor="birth_date" className="text-foreground">
              Data de Nascimento
              {formData.birth_date && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({calculateAge(formData.birth_date)} anos)
                </span>
              )}
            </Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
              className="glass border-primary/30 h-12 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Gênero</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                <SelectTrigger className="glass border-primary/30 h-12 rounded-xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="nao_binario">Não-binário</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Orientação</Label>
              <Select value={formData.sexual_orientation} onValueChange={(value) => setFormData({...formData, sexual_orientation: value})}>
                <SelectTrigger className="glass border-primary/30 h-12 rounded-xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heterossexual">Heterossexual</SelectItem>
                  <SelectItem value="homossexual">Homossexual</SelectItem>
                  <SelectItem value="bissexual">Bissexual</SelectItem>
                  <SelectItem value="pansexual">Pansexual</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Work */}
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg text-gradient">Localização e Trabalho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="state" className="text-foreground">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                className="glass border-primary/30 h-12 rounded-xl"
                placeholder="Ex: SP"
              />
            </div>
            <div>
              <Label htmlFor="city" className="text-foreground">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="glass border-primary/30 h-12 rounded-xl"
                placeholder="Ex: São Paulo"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="profession" className="text-foreground">Profissão</Label>
            <Input
              id="profession"
              value={formData.profession}
              onChange={(e) => setFormData({...formData, profession: e.target.value})}
              className="glass border-primary/30 h-12 rounded-xl"
              placeholder="Sua profissão"
            />
          </div>
        </CardContent>
      </Card>

      {/* Physical Info */}
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg text-gradient">Informações Físicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height" className="text-foreground">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
                className="glass border-primary/30 h-12 rounded-xl"
                placeholder="Ex: 175"
              />
            </div>
            <div>
              <Label htmlFor="weight" className="text-foreground">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                className="glass border-primary/30 h-12 rounded-xl"
                placeholder="Ex: 70"
              />
            </div>
          </div>

          <div>
            <Label className="text-foreground">Status de Relacionamento</Label>
            <Select value={formData.relationship_status} onValueChange={(value) => setFormData({...formData, relationship_status: value})}>
              <SelectTrigger className="glass border-primary/30 h-12 rounded-xl">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                <SelectItem value="casado">Casado(a)</SelectItem>
                <SelectItem value="relacionamento">Em relacionamento</SelectItem>
                <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg text-gradient">Interesses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addInterest()}
              className="glass border-primary/30 h-12 rounded-xl"
              placeholder="Adicionar interesse..."
            />
            <Button
              onClick={addInterest}
              className="bg-gradient-primary hover:opacity-90 text-white px-6 h-12 rounded-xl"
            >
              Adicionar
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.interests.map((interest, index) => (
              <div
                key={index}
                className="bg-gradient-secondary px-3 py-1 rounded-full text-white text-sm flex items-center gap-2"
              >
                {interest}
                <button
                  onClick={() => removeInterest(interest)}
                  className="text-white/70 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardContent className="p-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-primary hover:opacity-90 text-white h-12 rounded-xl"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};