import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Heart, 
  Settings, 
  LogOut,
  Crown,
  Edit,
  MessageCircle,
  Users,
  Target,
  ArrowLeft
} from "lucide-react";

export const ProfileTab = () => {
  const { user, signOut } = useAuth();
  const { profile, isPremium } = useProfile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
  };

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

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Back Button - Top Left Position */}
      <div className="flex items-center justify-start mb-2">
        <Button 
          onClick={() => navigate('/home')}
          variant="ghost" 
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded-full"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>
      {/* Profile Header */}
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardContent className="p-6">
          <div className="text-center">
            {/* Avatar */}
            <div className="relative mx-auto w-24 h-24 mb-4">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.display_name}
                  className="w-full h-full rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-primary flex items-center justify-center">
                  <User className="h-12 w-12 text-white" />
                </div>
              )}
              {isPremium && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Name and Premium Badge */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-white">{profile.display_name}</h1>
              {isPremium && (
                <span className="bg-gradient-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                  Premium
                </span>
              )}
            </div>

            {/* Age and Location */}
            <div className="flex items-center justify-center gap-4 text-gray-300 mb-4">
              {profile.birth_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{calculateAge(profile.birth_date)} anos</span>
                </div>
              )}
              {(profile.city || profile.state) && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.city}{profile.city && profile.state && ', '}{profile.state}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="text-center max-w-md mx-auto mb-4">
                <TruncatedText text={profile.bio} maxLength={190} />
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex justify-center gap-3">
              <Button 
                onClick={() => navigate('/profile/edit')}
                variant="outline" 
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/20"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Informações Pessoais</h2>
          <div className="space-y-4">
            {profile.profession && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-400">Profissão</p>
                  <p className="text-white">{profile.profession}</p>
                </div>
              </div>
            )}
            
            {profile.gender && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-400">Gênero</p>
                  <p className="text-white capitalize">{profile.gender}</p>
                </div>
              </div>
            )}
            
            {profile.sexual_orientation && (
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-400">Orientação Sexual</p>
                  <p className="text-white capitalize">{profile.sexual_orientation}</p>
                </div>
              </div>
            )}
            
            {profile.looking_for && (
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-400">Procurando por</p>
                  <p className="text-white">{profile.looking_for}</p>
                </div>
              </div>
            )}
            
            {profile.relationship_status && (
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-400">Status de Relacionamento</p>
                  <p className="text-white capitalize">{profile.relationship_status}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <Card className="bg-glass backdrop-blur-md border-primary/20">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Interesses</h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <span 
                  key={index}
                  className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm border border-primary/30"
                >
                  {interest}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Status */}
      {!isPremium && (
        <Card className="bg-gradient-primary/20 border-primary/30">
          <CardContent className="p-6">
            <div className="text-center">
              <Crown className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Desbloqueie Recursos Premium</h3>
              <p className="text-gray-300 mb-4">
                Acesse chat ilimitado, filtros avançados e muito mais!
              </p>
              <Button 
                onClick={() => navigate('/premium')}
                className="bg-gradient-primary hover:opacity-90 text-white"
              >
                Assinar Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Options */}
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Conta</h2>
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-primary/20"
            >
              <Settings className="h-5 w-5 mr-3" />
              Configurações
            </Button>
            
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};