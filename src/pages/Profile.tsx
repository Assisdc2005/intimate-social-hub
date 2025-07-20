import { User, MapPin, Calendar, Heart, Edit, Settings, Camera, Star, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const Profile = () => {
  const { profile, isPremium } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-foreground text-lg">Carregando perfil...</div>
      </div>
    );
  }

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4 pt-20">
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
                >
                  <Camera className="w-4 h-4" />
                </Button>
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