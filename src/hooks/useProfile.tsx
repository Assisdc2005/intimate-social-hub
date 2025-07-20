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
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
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
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      setProfile(data);
      return { data };
    } catch (error) {
      return { error };
    }
  };

  const isPremium = () => {
    if (!profile) return false;
    if (profile.subscription_type !== 'premium') return false;
    if (!profile.subscription_expires_at) return false;
    
    const expiresAt = new Date(profile.subscription_expires_at);
    return expiresAt > new Date();
  };

  return {
    profile,
    loading,
    updateProfile,
    isPremium: isPremium(),
  };
};