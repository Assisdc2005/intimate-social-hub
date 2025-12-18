import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const ACTIVE_TIME_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
const STORAGE_KEY = 'active_time_start';

/**
 * Hook that tracks consecutive active time and redirects to /complete-profile
 * after 3 minutes if the user hasn't completed their profile yet.
 */
export const useActiveTimeRedirect = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only track for logged-in users with incomplete profiles
    if (!user || profile?.profile_completed) {
      // Clear storage if profile is complete
      if (profile?.profile_completed) {
        sessionStorage.removeItem(STORAGE_KEY);
      }
      return;
    }

    // Don't redirect if already on complete-profile
    if (location.pathname === '/complete-profile') {
      return;
    }

    // Initialize start time if not set
    const existingStart = sessionStorage.getItem(STORAGE_KEY);
    if (!existingStart) {
      sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
    }

    // Check time periodically
    const checkTime = () => {
      const startTime = sessionStorage.getItem(STORAGE_KEY);
      if (!startTime) return;

      const elapsed = Date.now() - parseInt(startTime, 10);
      
      if (elapsed >= ACTIVE_TIME_THRESHOLD_MS) {
        // Only redirect if not already on complete-profile
        if (location.pathname !== '/complete-profile') {
          navigate('/complete-profile', { replace: true });
        }
      }
    };

    // Check every 10 seconds
    checkIntervalRef.current = setInterval(checkTime, 10000);

    // Also check immediately
    checkTime();

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, profile?.profile_completed, location.pathname, navigate]);
};
