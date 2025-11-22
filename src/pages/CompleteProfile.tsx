import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Removed Radix Select in this page to avoid StrictMode/portal errors
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Heart, ArrowLeft, ChevronDown } from 'lucide-react';

export const CompleteProfile = () => {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, refreshProfile } = useProfile();
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

  // IBGE dependent selects state
  type UF = { id: number; sigla: string; nome: string };
  type Municipio = { id: number; nome: string };
  const [ufs, setUfs] = useState<UF[]>([]);
  const [ufsLoading, setUfsLoading] = useState(false);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [municipiosLoading, setMunicipiosLoading] = useState(false);
  const [municipiosError, setMunicipiosError] = useState(false);
  const [manualCity, setManualCity] = useState('');

  const fallbackDisplayName = useMemo(() => {
    if (profile?.display_name?.trim()) return profile.display_name.trim();
    const metadataName = (user?.user_metadata as Record<string, any> | undefined)?.display_name;
    if (typeof metadataName === 'string' && metadataName.trim().length > 0) return metadataName.trim();
    if (user?.email) return user.email.split('@')[0];
    return 'Sensual Member';
  }, [profile?.display_name, user?.user_metadata, user?.email]);

  // Se o perfil já estiver completo por qualquer motivo, redireciona imediatamente
  useEffect(() => {
    if (profile?.profile_completed) {
      navigate('/profile', { replace: true });
    }
  }, [profile?.profile_completed, navigate]);

  // Fallback local UFs (27 unidades federativas)
  const localUFs: UF[] = [
    { id: 11, sigla: 'RO', nome: 'Rondônia' },
    { id: 12, sigla: 'AC', nome: 'Acre' },
    { id: 13, sigla: 'AM', nome: 'Amazonas' },
    { id: 14, sigla: 'RR', nome: 'Roraima' },
    { id: 15, sigla: 'PA', nome: 'Pará' },
    { id: 16, sigla: 'AP', nome: 'Amapá' },
    { id: 17, sigla: 'TO', nome: 'Tocantins' },
    { id: 21, sigla: 'MA', nome: 'Maranhão' },
    { id: 22, sigla: 'PI', nome: 'Piauí' },
    { id: 23, sigla: 'CE', nome: 'Ceará' },
    { id: 24, sigla: 'RN', nome: 'Rio Grande do Norte' },
    { id: 25, sigla: 'PB', nome: 'Paraíba' },
    { id: 26, sigla: 'PE', nome: 'Pernambuco' },
    { id: 27, sigla: 'AL', nome: 'Alagoas' },
    { id: 28, sigla: 'SE', nome: 'Sergipe' },
    { id: 29, sigla: 'BA', nome: 'Bahia' },
    { id: 31, sigla: 'MG', nome: 'Minas Gerais' },
    { id: 32, sigla: 'ES', nome: 'Espírito Santo' },
    { id: 33, sigla: 'RJ', nome: 'Rio de Janeiro' },
    { id: 35, sigla: 'SP', nome: 'São Paulo' },
    { id: 41, sigla: 'PR', nome: 'Paraná' },
    { id: 42, sigla: 'SC', nome: 'Santa Catarina' },
    { id: 43, sigla: 'RS', nome: 'Rio Grande do Sul' },
    { id: 50, sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { id: 51, sigla: 'MT', nome: 'Mato Grosso' },
    { id: 52, sigla: 'GO', nome: 'Goiás' },
    { id: 53, sigla: 'DF', nome: 'Distrito Federal' },
  ];

  // Fetch UFs from IBGE with fallback to BrasilAPI then local
  useEffect(() => {
    const loadUFs = async () => {
      setUfsLoading(true);
      try {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        if (!res.ok) throw new Error('IBGE UFs failed');
        const data = await res.json();
        const mapped: UF[] = data.map((d: any) => ({ id: d.id, sigla: d.sigla, nome: d.nome }));
        setUfs(mapped);
      } catch (e) {
        try {
          const res2 = await fetch('https://brasilapi.com.br/api/ibge/uf/v1');
          if (!res2.ok) throw new Error('BrasilAPI UFs failed');
          const data2 = await res2.json();
          const mapped2: UF[] = data2
            .sort((a: any, b: any) => a.nome.localeCompare(b.nome))
            .map((d: any) => ({ id: d.id, sigla: d.sigla, nome: d.nome }));
          setUfs(mapped2);
        } catch (e2) {
          setUfs(localUFs);
        }
      } finally {
        setUfsLoading(false);
      }
    };
    loadUFs();
  }, []);

  // Fetch Municipios when state changes
  useEffect(() => {
    const uf = formData.state; // expecting UF sigla
    setMunicipios([]);
    setMunicipiosError(false);
    setManualCity('');
    if (!uf) return;

    const loadCities = async () => {
      setMunicipiosLoading(true);
      try {
        // Try IBGE by UF sigla
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
        if (!res.ok) throw new Error('IBGE cities failed');
        const data = await res.json();
        const mapped: Municipio[] = data.map((m: any) => ({ id: m.id, nome: m.nome }));
        setMunicipios(mapped);
      } catch (e) {
        try {
          const res2 = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${uf}?providers=dados-abertos-br,gov,wikipedia`);
          if (!res2.ok) throw new Error('BrasilAPI cities failed');
          const data2 = await res2.json();
          const mapped2: Municipio[] = data2
            .sort((a: any, b: any) => a.nome.localeCompare(b.nome))
            .map((m: any) => ({ id: m.codigo_ibge || m.codigo, nome: m.nome }));
          setMunicipios(mapped2);
        } catch (e2) {
          setMunicipiosError(true);
        }
      } finally {
        setMunicipiosLoading(false);
      }
    };
    loadCities();
  }, [formData.state]);

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
        display_name: fallbackDisplayName,
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
        // Garantia de não reexibir o CompleteProfile caso o trigger não esteja ativo
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
        // Garantir que o contexto de perfil seja atualizado antes da navegação
        try {
          await refreshProfile();
        } catch (e) {
          // ignore
        }
        // Redirecionar para o perfil
        navigate('/profile', { replace: true });
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
                  <div className="relative">
                    <select
                      value={formData.gender}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                      className={`appearance-none bg-white/10 border border-primary/40 ${!formData.gender ? 'text-gray-300' : 'text-white'} w-full h-11 rounded-lg px-3 pr-10 py-2 text-sm backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 focus:shadow-[0_0_30px_rgba(255,54,164,0.15)] hover:bg-white/15 ${
                        errors.gender ? 'border-red-500 border-2' : ''
                      }`}
                    >
                      <option value="" disabled>Selecione</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="nao_binario">Não-binário</option>
                      <option value="outro">Outro</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  </div>
                  {errors.gender && <p className="text-red-400 text-xs mt-1">Campo obrigatório</p>}
                </div>
                
                <div>
                  <label className="text-white text-sm">Orientação Sexual *</label>
                  <div className="relative">
                    <select
                      value={formData.sexual_orientation}
                      onChange={(e) => handleFieldChange('sexual_orientation', e.target.value)}
                      className={`appearance-none bg-white/10 border border-primary/40 ${!formData.sexual_orientation ? 'text-gray-300' : 'text-white'} w-full h-11 rounded-lg px-3 pr-10 py-2 text-sm backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 focus:shadow-[0_0_30px_rgba(255,54,164,0.15)] hover:bg-white/15 ${
                        errors.sexual_orientation ? 'border-red-500 border-2' : ''
                      }`}
                    >
                      <option value="" disabled>Selecione</option>
                      <option value="heterossexual">Heterossexual</option>
                      <option value="homossexual">Homossexual</option>
                      <option value="bissexual">Bissexual</option>
                      <option value="pansexual">Pansexual</option>
                      <option value="outro">Outro</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  </div>
                  {errors.sexual_orientation && <p className="text-red-400 text-xs mt-1">Campo obrigatório</p>}
                </div>
                
                <div>
                  <label className="text-white text-sm">Estado *</label>
                  <div className="relative">
                    <select
                      value={formData.state}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleFieldChange('state', val);
                        // reset city when state changes
                        handleFieldChange('city', '');
                      }}
                      disabled={ufsLoading}
                      className={`appearance-none bg-white/10 border border-primary/40 ${!formData.state ? 'text-gray-300' : 'text-white'} w-full h-11 rounded-lg px-3 pr-10 py-2 text-sm backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 focus:shadow-[0_0_30px_rgba(255,54,164,0.15)] hover:bg-white/15 ${
                        errors.state ? 'border-red-500 border-2' : ''
                      }`}
                    >
                      <option value="" disabled>{ufsLoading ? 'Carregando...' : 'Selecione o estado (UF)'}</option>
                      {ufs.map((uf) => (
                        <option key={uf.id} value={uf.sigla}>{uf.nome} ({uf.sigla})</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  </div>
                  {errors.state && <p className="text-red-400 text-xs mt-1">Campo obrigatório</p>}
                </div>
                
                <div>
                  <label className="text-white text-sm">Cidade *</label>
                  {(!municipiosError && municipios.length > 0) ? (
                    <div className="relative">
                      <select
                        value={formData.city}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        disabled={!formData.state || municipiosLoading}
                        className={`appearance-none bg-white/10 border border-primary/40 ${!formData.city ? 'text-gray-300' : 'text-white'} w-full h-11 rounded-lg px-3 pr-10 py-2 text-sm backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 focus:shadow-[0_0_30px_rgba(255,54,164,0.15)] hover:bg-white/15 ${
                          errors.city ? 'border-red-500 border-2' : ''
                        }`}
                      >
                        <option value="" disabled>{municipiosLoading ? 'Carregando...' : 'Selecione a cidade'}</option>
                        {municipios.map((m) => (
                          <option key={m.id} value={m.nome}>{m.nome}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    </div>
                  ) : (
                    <Input
                      value={manualCity}
                      onChange={(e) => {
                        setManualCity(e.target.value);
                        handleFieldChange('city', e.target.value);
                      }}
                      placeholder={municipiosLoading ? 'Carregando...' : 'Digite sua cidade'}
                      className={`bg-white/10 border-primary/30 text-white placeholder:text-gray-400 ${
                        errors.city ? 'border-red-500 border-2' : ''
                      }`}
                    />
                  )}
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
                  <div className="relative">
                    <select
                      value={formData.relationship_status}
                      onChange={(e) => handleFieldChange('relationship_status', e.target.value)}
                      className={`appearance-none bg-white/10 border border-primary/40 ${!formData.relationship_status ? 'text-gray-300' : 'text-white'} w-full h-11 rounded-lg px-3 pr-10 py-2 text-sm backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 focus:shadow-[0_0_30px_rgba(255,54,164,0.15)] hover:bg-white/15 ${
                        errors.relationship_status ? 'border-red-500 border-2' : ''
                      }`}
                    >
                      <option value="" disabled>Selecione</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="relacionamento">Em relacionamento</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  </div>
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
    </div>
  );
};
