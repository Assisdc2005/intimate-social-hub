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
import { Heart, ArrowLeft } from 'lucide-react';
import { RedirectPopup } from '@/components/Profile/RedirectPopup';

export const CompleteProfile = () => {
  const { user, signOut } = useAuth();
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
  const [errors, setErrors] = useState<{[key: string]: boolean}>({});
  const [showRedirectPopup, setShowRedirectPopup] = useState(false);

  // Campos obrigatórios
  const requiredFields = ['birth_date', 'gender', 'sexual_orientation', 'state', 'city', 'profession', 'relationship_status', 'bio'];

  // Função para retornar à página de autenticação
  const handleBackToAuth = async () => {
    await signOut();
    navigate('/auth');
  };

  // Validar se todos os campos obrigatórios estão preenchidos
  const validateForm = () => {
    const newErrors: {[key: string]: boolean} = {};
    let hasErrors = false;

    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData] || formData[field as keyof typeof formData] === '') {
        newErrors[field] = true;
        hasErrors = true;
      }
    });

    // Validar se pelo menos um interesse foi selecionado
    if (formData.interests.length === 0) {
      newErrors['interests'] = true;
      hasErrors = true;
    }

    setErrors(newErrors);

    if (hasErrors) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, complete todas as informações antes de finalizar seu perfil.",
        variant: "destructive",
      });
    }

    return !hasErrors;
  };

  // Verificar se o formulário está válido
  const isFormValid = () => {
    return requiredFields.every(field => 
      formData[field as keyof typeof formData] && formData[field as keyof typeof formData] !== ''
    ) && formData.interests.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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
        setShowRedirectPopup(true);
        
        // Navegar após o popup
        setTimeout(() => {
          navigate('/home');
        }, 2500);
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
    
    // Remover erro de interesses se algum for selecionado
    if (errors['interests'] && !formData.interests.includes(interest)) {
      setErrors(prev => ({ ...prev, interests: false }));
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Remover erro do campo quando ele for preenchido
    if (errors[field] && value && value !== '') {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const commonInterests = [
    'Romance', 'Aventura', 'Relacionamento Sério', 'Diversão', 'Amizade',
    'Música', 'Viagens', 'Esportes', 'Culinária', 'Cinema', 'Arte', 'Natureza'
  ];

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      {/* Botão de retorno no topo */}
      <div className="max-w-2xl mx-auto mb-4">
        <Button
          onClick={handleBackToAuth}
          variant="ghost"
          className="text-white hover:bg-white/10 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Login
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-glass backdrop-blur-md border-primary/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Sensual
              </h1>
            </div>
            <CardTitle className="text-white">Complete seu perfil</CardTitle>
            <p className="text-gray-300">Preencha as informações para melhorar suas conexões</p>
            <p className="text-sm text-yellow-300 mt-2">* Campos obrigatórios</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm">Data de nascimento *</label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleFieldChange('birth_date', e.target.value)}
                    required
                    className={`bg-white/10 border-primary/30 text-white placeholder:text-gray-400 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert ${
                      errors.birth_date ? 'border-red-500 border-2' : ''
                    }`}
                  />
                  {errors.birth_date && <p className="text-red-400 text-xs mt-1">Campo obrigatório</p>}
                </div>
                
                <div>
                  <label className="text-white text-sm">Gênero *</label>
                  <Select value={formData.gender} onValueChange={(value) => handleFieldChange('gender', value)}>
                    <SelectTrigger className={`bg-white/10 border-primary/30 text-white ${
                      errors.gender ? 'border-red-500 border-2' : ''
                    }`}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="masculino" className="text-white hover:bg-gray-700">Masculino</SelectItem>
                      <SelectItem value="feminino" className="text-white hover:bg-gray-700">Feminino</SelectItem>
                      <SelectItem value="nao_binario" className="text-white hover:bg-gray-700">Não-binário</SelectItem>
                      <SelectItem value="outro" className="text-white hover:bg-gray-700">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-red-400 text-xs mt-1">Campo obrigatório</p>}
                </div>
                
                <div>
                  <label className="text-white text-sm">Orientação Sexual *</label>
                  <Select value={formData.sexual_orientation} onValueChange={(value) => handleFieldChange('sexual_orientation', value)}>
                    <SelectTrigger className={`bg-white/10 border-primary/30 text-white ${
                      errors.sexual_orientation ? 'border-red-500 border-2' : ''
                    }`}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="heterossexual" className="text-white hover:bg-gray-700">Heterossexual</SelectItem>
                      <SelectItem value="homossexual" className="text-white hover:bg-gray-700">Homossexual</SelectItem>
                      <SelectItem value="bissexual" className="text-white hover:bg-gray-700">Bissexual</SelectItem>
                      <SelectItem value="pansexual" className="text-white hover:bg-gray-700">Pansexual</SelectItem>
                      <SelectItem value="outro" className="text-white hover:bg-gray-700">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sexual_orientation && <p className="text-red-400 text-xs mt-1">Campo obrigatório</p>}
                </div>
                
                <div>
                  <label className="text-white text-sm">Estado *</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => handleFieldChange('state', e.target.value)}
                    placeholder="Ex: São Paulo"
                    className={`bg-white/10 border-primary/30 text-white placeholder:text-gray-400 ${
                      errors.state ? 'border-red-500 border-2' : ''
                    }`}
                  />
                  {errors.state && <p className="text-red-400 text-xs mt-1">Campo obrigatório</p>}
                </div>
                
                <div>
                  <label className="text-white text-sm">Cidade *</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    placeholder="Ex: São Paulo"
                    className={`bg-white/10 border-primary/30 text-white placeholder:text-gray-400 ${
                      errors.city ? 'border-red-500 border-2' : ''
                    }`}
                  />
                  {errors.city && <p className="text-red-400 text-xs mt-1">Campo obrigatório</p>}
                </div>
                
                <div>
                  <label className="text-white text-sm">Profissão *</label>
                  <Input
                    value={formData.profession}
                    onChange={(e) => handleFieldChange('profession', e.target.value)}
                    placeholder="Ex: Designer"
                    className={`bg-white/10 border-primary/30 text-white placeholder:text-gray-400 ${
                      errors.profession ? 'border-red-500 border-2' : ''
                    }`}
                  />
                  {errors.profession && <p className="text-red-400 text-xs mt-1">Campo obrigatório</p>}
                </div>
                
                <div>
                  <label className="text-white text-sm">Status de Relacionamento *</label>
                  <Select value={formData.relationship_status} onValueChange={(value) => handleFieldChange('relationship_status', value)}>
                    <SelectTrigger className={`bg-white/10 border-primary/30 text-white ${
                      errors.relationship_status ? 'border-red-500 border-2' : ''
                    }`}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="solteiro" className="text-white hover:bg-gray-700">Solteiro(a)</SelectItem>
                      <SelectItem value="casado" className="text-white hover:bg-gray-700">Casado(a)</SelectItem>
                      <SelectItem value="relacionamento" className="text-white hover:bg-gray-700">Em relacionamento</SelectItem>
                      <SelectItem value="divorciado" className="text-white hover:bg-gray-700">Divorciado(a)</SelectItem>
                      <SelectItem value="viuvo" className="text-white hover:bg-gray-700">Viúvo(a)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.relationship_status && <p className="text-red-400 text-xs mt-1">Campo obrigatório</p>}
                </div>
                
                <div>
                  <label className="text-white text-sm">Altura (cm)</label>
                  <Input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleFieldChange('height', e.target.value)}
                    placeholder="170"
                    className="bg-white/10 border-primary/30 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-white text-sm">Sobre você *</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  className={`bg-white/10 border-primary/30 text-white placeholder:text-gray-400 ${
                    errors.bio ? 'border-red-500 border-2' : ''
                  }`}
                />
                {errors.bio && <p className="text-red-400 text-xs mt-1">Campo obrigatório</p>}
              </div>
              
              <div>
                <label className="text-white text-sm mb-3 block">Interesses * (selecione pelo menos um)</label>
                <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 ${
                  errors.interests ? 'p-2 border border-red-500 rounded-lg' : ''
                }`}>
                  {commonInterests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        formData.interests.includes(interest)
                          ? 'bg-gradient-primary text-white'
                          : 'bg-white/10 border border-primary/30 text-gray-300 hover:bg-primary/20'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                {errors.interests && <p className="text-red-400 text-xs mt-1">Selecione pelo menos um interesse</p>}
              </div>
              
              <Button
                type="submit"
                disabled={loading || !isFormValid()}
                className={`w-full font-semibold transition-all ${
                  isFormValid() 
                    ? 'bg-gradient-primary hover:opacity-90 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Salvando...' : 'Completar Perfil'}
              </Button>
              
              {!isFormValid() && (
                <p className="text-center text-yellow-300 text-sm">
                  Preencha todos os campos obrigatórios para continuar.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
      
      <RedirectPopup
        isOpen={showRedirectPopup}
        onClose={() => setShowRedirectPopup(false)}
      />
    </div>
  );
};
