import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { User, MapPin, Heart, Users, Target, Calendar, Briefcase } from "lucide-react";

export const AboutTab = () => {
  const { profile } = useProfile();

  const calculateAge = (birthDate?: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const age = calculateAge(profile?.birth_date);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Sobre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-gray-200">
          {profile?.bio && (
            <p className="text-white/90">{profile.bio}</p>
          )}
          {age && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{age} anos</span>
            </div>
          )}
          {profile?.gender && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-primary" />
              <span className="capitalize">{profile.gender}</span>
            </div>
          )}
          {(profile?.city || profile?.state) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{profile?.city}{profile?.city && profile?.state && ", "}{profile?.state}</span>
            </div>
          )}
          {profile?.profession && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>{profile.profession}</span>
            </div>
          )}
          {profile?.sexual_orientation && (
            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-primary" />
              <span className="capitalize">{profile.sexual_orientation}</span>
            </div>
          )}
          {profile?.relationship_status && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="capitalize">{profile.relationship_status}</span>
            </div>
          )}
          {profile?.looking_for && (
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-primary" />
              <span>{profile.looking_for}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutTab;
