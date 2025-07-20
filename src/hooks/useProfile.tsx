
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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *
          `)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (data) {
          // Garantir que os campos obrigatórios tenham valores padrão
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
            tipo_assinatura: 'gratuito', // Default value since column doesn't exist
            assinatura_id: null, // Default value since column doesn't exist
            created_at: data.created_at,
            updated_at: data.updated_at
          };
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

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
        // Garantir que os campos obrigatórios tenham valores padrão
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
          tipo_assinatura: 'gratuito', // Default value since column doesn't exist
          assinatura_id: null, // Default value since column doesn't exist
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

  const isPremium = () => {
    if (!profile) return false;
    return profile.premium_status === 'premium' && profile.tipo_assinatura === 'premium';
  };

  return {
    profile,
    loading,
    updateProfile,
    isPremium: isPremium(),
  };
};
