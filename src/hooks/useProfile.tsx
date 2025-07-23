
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
  subscription_type: 'gratuito' | 'premium';
  subscription_expires_at?: string;
  profile_completed: boolean;
  avatar_url?: string;
  premium_status: string;
  tipo_assinatura: string;
  assinatura_id?: string;
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
      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        console.log('Profile data loaded:', data);
        
        // Map data to Profile interface with proper defaults
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
          subscription_type: data.subscription_type || 'gratuito',
          subscription_expires_at: data.subscription_expires_at,
          profile_completed: data.profile_completed || false,
          avatar_url: data.avatar_url,
          premium_status: data.premium_status || 'nao_premium',
          tipo_assinatura: data.tipo_assinatura || 'gratuito',
          assinatura_id: data.assinatura_id || null,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        console.log('Profile premium status:', profileData.tipo_assinatura);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error:', error);
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

    console.log('Setting up real-time subscription for profile changes');
    
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
          console.log('Profile updated via real-time:', payload.new);
          
          // Atualizar o estado do perfil com os novos dados
          const updatedProfile = {
            ...profile,
            ...payload.new,
            premium_status: payload.new.premium_status || 'nao_premium',
            tipo_assinatura: payload.new.tipo_assinatura || 'gratuito',
          } as Profile;
          
          console.log('Updated profile status:', updatedProfile.tipo_assinatura);
          setProfile(updatedProfile);
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from profile changes');
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  const updateProfile = async (updates: any) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      console.log('Updating profile for user:', user.id, 'with updates:', updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Supabase update error:', error);
        return { error };
      }

      if (data) {
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
          subscription_type: data.subscription_type || 'gratuito',
          subscription_expires_at: data.subscription_expires_at,
          profile_completed: data.profile_completed || false,
          avatar_url: data.avatar_url,
          premium_status: data.premium_status || 'nao_premium',
          tipo_assinatura: data.tipo_assinatura || 'gratuito',
          assinatura_id: data.assinatura_id || null,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        setProfile(profileData);
        return { data: profileData };
      }

      return { error: 'No data returned' };
    } catch (error) {
      console.error('Update profile catch error:', error);
      return { error };
    }
  };

  // Função para recarregar o perfil manualmente
  const refreshProfile = async () => {
    console.log('Manually refreshing profile...');
    await fetchProfile();
  };

  // Verificar se é premium baseado EXCLUSIVAMENTE no campo tipo_assinatura
  const isPremium = () => {
    if (!profile) return false;
    const isPremiumStatus = profile.tipo_assinatura === 'premium';
    console.log('isPremium check:', isPremiumStatus, 'tipo_assinatura:', profile.tipo_assinatura);
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
