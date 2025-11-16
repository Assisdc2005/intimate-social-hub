
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: any) => Promise<{ data?: Profile; error?: any }>;
  refreshProfile: () => Promise<void>;
  isPremium: boolean;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
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
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching profile:', error);
      } 

      if (!data) {
        // Create minimal profile row if not exists
        console.log('ℹ️ No profile row found. Creating minimal profile...');
        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, display_name: user.email?.split('@')[0] || 'Usuário' })
          .select('*')
          .single();
        if (createErr) {
          console.error('❌ Error creating minimal profile:', createErr);
        } else {
          const tipoAssinatura = (created.tipo_assinatura === 'premium') ? 'premium' : 'gratuito';
          const profileData: Profile = {
            id: created.id,
            user_id: created.user_id,
            display_name: created.display_name,
            bio: created.bio,
            birth_date: created.birth_date,
            gender: created.gender,
            sexual_orientation: created.sexual_orientation,
            state: created.state,
            city: created.city,
            profession: created.profession,
            looking_for: created.looking_for,
            objectives: created.objectives,
            body_type: created.body_type,
            height: created.height,
            weight: created.weight,
            ethnicity: created.ethnicity,
            smokes: created.smokes,
            drinks: created.drinks,
            relationship_status: created.relationship_status,
            interests: created.interests,
            profile_completed: created.profile_completed || false,
            avatar_url: created.avatar_url,
            tipo_assinatura: tipoAssinatura,
            subscription_expires_at: (created as any).subscription_expires_at,
            assinatura_id: (created as any).assinatura_id,
            created_at: created.created_at,
            updated_at: created.updated_at
          };
          setProfile(profileData);
        }
      } else {
        console.log('✅ Profile data loaded:', data);
        
        // Ensure tipo_assinatura is properly typed
        const tipoAssinatura = (data.tipo_assinatura === 'premium') ? 'premium' : 'gratuito';

        const hasRequiredFields = !!(
          data.display_name &&
          data.birth_date &&
          data.gender &&
          data.sexual_orientation &&
          data.state &&
          data.city &&
          data.profession &&
          data.relationship_status &&
          data.bio &&
          Array.isArray(data.interests) && data.interests.length > 0
        );
        const computedProfileCompleted = !!(data.profile_completed || hasRequiredFields);
        
        // Map data to Profile interface - safely handle new fields
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
          profile_completed: computedProfileCompleted,
          avatar_url: data.avatar_url,
          tipo_assinatura: tipoAssinatura, // CAMPO PRINCIPAL
          subscription_expires_at: (data as any).subscription_expires_at, // Safe access to new field
          assinatura_id: (data as any).assinatura_id, // Safe access to new field
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
    if (!user?.id) return;

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
          
          if (payload.new) {
            const tipoAssinatura = (payload.new.tipo_assinatura === 'premium') ? 'premium' : 'gratuito';
            setProfile((prev) => {
              const merged = {
                ...(prev || {}),
                ...payload.new,
                tipo_assinatura: tipoAssinatura,
                subscription_expires_at: (payload.new as any).subscription_expires_at,
                assinatura_id: (payload.new as any).assinatura_id,
              } as Profile;

              const hasRequiredFields = !!(
                merged.display_name &&
                merged.birth_date &&
                merged.gender &&
                merged.sexual_orientation &&
                merged.state &&
                merged.city &&
                merged.profession &&
                merged.relationship_status &&
                merged.bio &&
                Array.isArray(merged.interests) && merged.interests.length > 0
              );
              merged.profile_completed = !!(merged.profile_completed || hasRequiredFields);

              console.log('🔄 Updated profile status:', merged.tipo_assinatura, 'profile_completed:', merged.profile_completed);
              return merged;
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('📡 Unsubscribing from profile changes');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const updateProfile = async (updates: any) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      console.log('🔄 Updating profile for user:', user.id, 'with updates:', updates);
      
      // Use upsert to avoid PGRST116 when row doesn't exist or zero rows affected
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ ...updates, user_id: user.id }, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ Supabase update error:', error);
        // Fallback: if PGRST116 (no rows returned), try fetching current profile
        if ((error as any).code === 'PGRST116') {
          const { data: existing, error: fetchErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          if (fetchErr) return { error: fetchErr };
          // Return existing as success since the row exists but update returned 0 rows
          const tipoAssinatura = (existing.tipo_assinatura === 'premium') ? 'premium' : 'gratuito';
          const hasRequiredFields = !!(
            existing.display_name &&
            existing.birth_date &&
            existing.gender &&
            existing.sexual_orientation &&
            existing.state &&
            existing.city &&
            existing.profession &&
            existing.relationship_status &&
            existing.bio &&
            Array.isArray(existing.interests) && existing.interests.length > 0
          );
          const computedProfileCompleted = !!(existing.profile_completed || hasRequiredFields);

          const profileData: Profile = {
            id: existing.id,
            user_id: existing.user_id,
            display_name: existing.display_name,
            bio: existing.bio,
            birth_date: existing.birth_date,
            gender: existing.gender,
            sexual_orientation: existing.sexual_orientation,
            state: existing.state,
            city: existing.city,
            profession: existing.profession,
            looking_for: existing.looking_for,
            objectives: existing.objectives,
            body_type: existing.body_type,
            height: existing.height,
            weight: existing.weight,
            ethnicity: existing.ethnicity,
            smokes: existing.smokes,
            drinks: existing.drinks,
            relationship_status: existing.relationship_status,
            interests: existing.interests,
            profile_completed: computedProfileCompleted,
            avatar_url: existing.avatar_url,
            tipo_assinatura: tipoAssinatura,
            subscription_expires_at: (existing as any).subscription_expires_at,
            assinatura_id: (existing as any).assinatura_id,
            created_at: existing.created_at,
            updated_at: existing.updated_at
          };
          setProfile(profileData);
          return { data: profileData };
        }
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
          subscription_expires_at: (data as any).subscription_expires_at,
          assinatura_id: (data as any).assinatura_id,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        setProfile(profileData);
        return { data: profileData };
      }

      // If upsert returned no data (unlikely), fetch current profile
      const { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (fetchErr) return { error: fetchErr };
      const tipoAssinatura = (existing.tipo_assinatura === 'premium') ? 'premium' : 'gratuito';
      const hasRequiredFields = !!(
        existing.display_name &&
        existing.birth_date &&
        existing.gender &&
        existing.sexual_orientation &&
        existing.state &&
        existing.city &&
        existing.profession &&
        existing.relationship_status &&
        existing.bio &&
        Array.isArray(existing.interests) && existing.interests.length > 0
      );
      const computedProfileCompleted = !!(existing.profile_completed || hasRequiredFields);

      const profileData: Profile = {
        id: existing.id,
        user_id: existing.user_id,
        display_name: existing.display_name,
        bio: existing.bio,
        birth_date: existing.birth_date,
        gender: existing.gender,
        sexual_orientation: existing.sexual_orientation,
        state: existing.state,
        city: existing.city,
        profession: existing.profession,
        looking_for: existing.looking_for,
        objectives: existing.objectives,
        body_type: existing.body_type,
        height: existing.height,
        weight: existing.weight,
        ethnicity: existing.ethnicity,
        smokes: existing.smokes,
        drinks: existing.drinks,
        relationship_status: existing.relationship_status,
        interests: existing.interests,
        profile_completed: computedProfileCompleted,
        avatar_url: existing.avatar_url,
        tipo_assinatura: tipoAssinatura,
        subscription_expires_at: (existing as any).subscription_expires_at,
        assinatura_id: (existing as any).assinatura_id,
        created_at: existing.created_at,
        updated_at: existing.updated_at
      };
      setProfile(profileData);
      return { data: profileData };
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
  const isPremium = useMemo(() => {
    if (!profile) return false;
    const isPremiumStatus = profile.tipo_assinatura === 'premium';
    console.log('🎯 isPremium check:', isPremiumStatus, 'tipo_assinatura:', profile.tipo_assinatura);
    return isPremiumStatus;
  }, [profile]);

  const value: ProfileContextValue = {
    profile,
    loading,
    updateProfile,
    refreshProfile,
    isPremium,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return ctx;
};
