import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  birth_date?: string;
  gender?: string;
  sexual_orientation?: string;
  state?: string;
  city?: string;
  profession?: string;
  looking_for?: string;
  objectives?: string;
  body_type?: string;
  height?: number;
  weight?: number;
  ethnicity?: string;
  smokes?: boolean;
  drinks?: boolean;
  relationship_status?: string;
  interests?: string[];
  profile_completed: boolean;
  avatar_url?: string;
  tipo_assinatura: 'gratuito' | 'premium'; // FONTE ÚNICA DA VERDADE
  subscription_expires_at?: string; // Novo campo
  assinatura_id?: string; // Novo campo
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
      } else if (data) {
        console.log('✅ Profile data loaded:', data);
        
        // Ensure tipo_assinatura is properly typed
        const tipoAssinatura = (data.tipo_assinatura === 'premium') ? 'premium' : 'gratuito';
        
        // Map data to Profile interface
        const profileData: Profile = {
          id: data.id,
          user_id: data.user_id,
          display_name: data.display_name,
          bio: data.bio,
          birth_date: data.birth_date,
          gender: data.gender,
          sexual_orientation: data.sexual_orientation,
          state: data.state,
          city: data.city,
          profession: data.profession,
          looking_for: data.looking_for,
          objectives: data.objectives,
          body_type: data.body_type,
          height: data.height,
          weight: data.weight,
          ethnicity: data.ethnicity,
          smokes: data.smokes,
          drinks: data.drinks,
          relationship_status: data.relationship_status,
          interests: data.interests,
          profile_completed: data.profile_completed || false,
          avatar_url: data.avatar_url,
          tipo_assinatura: tipoAssinatura, // CAMPO PRINCIPAL
          subscription_expires_at: data.subscription_expires_at, // Novo campo
          assinatura_id: data.assinatura_id, // Novo campo
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        console.log('🎯 Profile subscription status:', profileData.tipo_assinatura);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Configurar real-time subscription para mudanças no perfil
  useEffect(() => {
    if (!user) return;

    console.log('📡 Setting up real-time subscription for profile changes');
    
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Profile updated via real-time:', payload.new);
          
          // Atualizar o estado do perfil com os novos dados
          if (payload.new) {
            const tipoAssinatura = (payload.new.tipo_assinatura === 'premium') ? 'premium' : 'gratuito';
            
            const updatedProfile = {
              ...profile,
              ...payload.new,
              tipo_assinatura: tipoAssinatura,
              subscription_expires_at: payload.new.subscription_expires_at,
              assinatura_id: payload.new.assinatura_id,
            } as Profile;
            
            console.log('🔄 Updated profile status:', updatedProfile.tipo_assinatura);
            setProfile(updatedProfile);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('📡 Unsubscribing from profile changes');
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  const updateProfile = async (updates: any) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      console.log('🔄 Updating profile for user:', user.id, 'with updates:', updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update error:', error);
        return { error };
      }

      if (data) {
        // Ensure tipo_assinatura is properly typed
        const tipoAssinatura = (data.tipo_assinatura === 'premium') ? 'premium' : 'gratuito';
        
        // Map updated data to Profile interface
        const profileData: Profile = {
          id: data.id,
          user_id: data.user_id,
          display_name: data.display_name,
          bio: data.bio,
          birth_date: data.birth_date,
          gender: data.gender,
          sexual_orientation: data.sexual_orientation,
          state: data.state,
          city: data.city,
          profession: data.profession,
          looking_for: data.looking_for,
          objectives: data.objectives,
          body_type: data.body_type,
          height: data.height,
          weight: data.weight,
          ethnicity: data.ethnicity,
          smokes: data.smokes,
          drinks: data.drinks,
          relationship_status: data.relationship_status,
          interests: data.interests,
          profile_completed: data.profile_completed || false,
          avatar_url: data.avatar_url,
          tipo_assinatura: tipoAssinatura,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        setProfile(profileData);
        return { data: profileData };
      }

      return { error: 'No data returned' };
    } catch (error) {
      console.error('❌ Update profile catch error:', error);
      return { error };
    }
  };

  // Função para recarregar o perfil manualmente
  const refreshProfile = async () => {
    console.log('🔄 Manually refreshing profile...');
    setLoading(true);
    await fetchProfile();
  };

  // Verificar se é premium baseado EXCLUSIVAMENTE no campo tipo_assinatura
  const isPremium = () => {
    if (!profile) return false;
    const isPremiumStatus = profile.tipo_assinatura === 'premium';
    console.log('🎯 isPremium check:', isPremiumStatus, 'tipo_assinatura:', profile.tipo_assinatura);
    return isPremiumStatus;
  };

  return {
    profile,
    loading,
    updateProfile,
    refreshProfile,
    isPremium: isPremium(),
  };
};
