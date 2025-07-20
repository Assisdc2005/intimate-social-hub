import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';

export const CompleteProfile = () => {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    birth_date: '',
    gender: '',
    sexual_orientation: '',
    state: '',
    city: '',
    profession: '',
    looking_for: '',
    objectives: '',
    body_type: '',
    height: '',
    weight: '',
    ethnicity: '',
    smokes: false,
    drinks: false,
    relationship_status: '',
    bio: '',
    interests: [] as string[],
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profileData = {
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        sexual_orientation: formData.sexual_orientation || null,
        state: formData.state || null,
        city: formData.city || null,
        profession: formData.profession || null,
        looking_for: formData.looking_for || null,
        objectives: formData.objectives || null,
        body_type: formData.body_type || null,
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        ethnicity: formData.ethnicity || null,
        smokes: formData.smokes,
        drinks: formData.drinks,
        relationship_status: formData.relationship_status || null,
        bio: formData.bio || null,
        interests: formData.interests,
        profile_completed: true,
      };

      console.log('Updating profile with data:', profileData);
      const { error } = await updateProfile(profileData);
      
      if (error) {
        console.error('Profile update error:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao salvar perfil",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Perfil completado!",
          description: "Bem-vindo(a) ao Sensual Nexus Connect",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const commonInterests = [
    'Romance', 'Aventura', 'Relacionamento Sério', 'Diversão', 'Amizade',
    'Música', 'Viagens', 'Esportes', 'Culinária', 'Cinema', 'Arte', 'Natureza'
  ];

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-glass backdrop-blur-md border-primary/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-text bg-clip-text text-transparent">
                Sensual
              </h1>
            </div>
            <CardTitle className="text-white">Complete seu perfil</CardTitle>
            <p className="text-gray-300">Preencha as informações para melhorar suas conexões</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm">Data de nascimento</label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    required
                    className="bg-glass border-primary/30 text-white"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm">Gênero</label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                    <SelectTrigger className="bg-glass border-primary/30 text-white">
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
                  <label className="text-white text-sm">Orientação Sexual</label>
                  <Select value={formData.sexual_orientation} onValueChange={(value) => setFormData({...formData, sexual_orientation: value})}>
                    <SelectTrigger className="bg-glass border-primary/30 text-white">
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
                
                <div>
                  <label className="text-white text-sm">Estado</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    placeholder="Ex: São Paulo"
                    className="bg-glass border-primary/30 text-white placeholder:text-gray-300"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm">Cidade</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Ex: São Paulo"
                    className="bg-glass border-primary/30 text-white placeholder:text-gray-300"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm">Profissão</label>
                  <Input
                    value={formData.profession}
                    onChange={(e) => setFormData({...formData, profession: e.target.value})}
                    placeholder="Ex: Designer"
                    className="bg-glass border-primary/30 text-white placeholder:text-gray-300"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm">Status de Relacionamento</label>
                  <Select value={formData.relationship_status} onValueChange={(value) => setFormData({...formData, relationship_status: value})}>
                    <SelectTrigger className="bg-glass border-primary/30 text-white">
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
                
                <div>
                  <label className="text-white text-sm">Altura (cm)</label>
                  <Input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: e.target.value})}
                    placeholder="170"
                    className="bg-glass border-primary/30 text-white placeholder:text-gray-300"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-white text-sm">Sobre você</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Conte um pouco sobre você..."
                  className="bg-glass border-primary/30 text-white placeholder:text-gray-300"
                />
              </div>
              
              <div>
                <label className="text-white text-sm mb-3 block">Interesses</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonInterests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        formData.interests.includes(interest)
                          ? 'bg-gradient-primary text-white'
                          : 'bg-glass border border-primary/30 text-gray-300 hover:bg-primary/20'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold"
              >
                {loading ? 'Salvando...' : 'Completar Perfil'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};