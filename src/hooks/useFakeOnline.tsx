import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// Types passed by components when registering candidates
export interface CandidateProfile {
  user_id: string;
  isRealOnline: boolean; // computed by component using status_online/last_seen
}

interface FakeOnlineContextValue {
  isFakeOnline: (userId?: string | null) => boolean;
  isOnlineOrFake: (profile: { user_id?: string | null; status_online?: any; last_seen?: string | null }) => boolean;
  registerCandidates: (candidates: CandidateProfile[]) => void;
}

const FakeOnlineContext = createContext<FakeOnlineContextValue | null>(null);

const BATCH_MIN = 5;
const BATCH_MAX = 12;
const DURATION_MS = 7 * 60 * 1000; // 7 minutes
const ROTATE_INTERVAL_MS = 2 * 60 * 1000; // rotate every 2 minutes
const CLEANUP_INTERVAL_MS = 30 * 1000; // cleanup every 30 seconds

export const FakeOnlineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fakeOnline, setFakeOnline] = useState<Map<string, number>>(new Map()); // user_id -> expiresAt
  const candidatesRef = useRef<Map<string, boolean>>(new Map()); // user_id -> isRealOnline

  // Register seen candidates from any list/view
  const registerCandidates = useCallback((candidates: CandidateProfile[]) => {
    if (!candidates?.length) return;
    const map = candidatesRef.current;
    for (const c of candidates) {
      if (!c?.user_id) continue;
      map.set(c.user_id, !!c.isRealOnline);
    }
  }, []);

  // Helper: detect real online based on profile fields
  const isRealOnlineFromProfile = (p: { status_online?: any; last_seen?: string | null }) => {
    if (p?.status_online === true || p?.status_online === "true") return true;
    if (!p?.last_seen) return false;
    const FIVE_MIN = 5 * 60 * 1000;
    const last = new Date(p.last_seen).getTime();
    return Date.now() - last <= FIVE_MIN;
  };

  const isFakeOnline = useCallback((userId?: string | null) => {
    if (!userId) return false;
    const exp = fakeOnline.get(userId);
    return !!exp && exp > Date.now();
  }, [fakeOnline]);

  const isOnlineOrFake = useCallback((profile: { user_id?: string | null; status_online?: any; last_seen?: string | null }) => {
    if (!profile?.user_id) return false;
    const real = isRealOnlineFromProfile(profile);
    if (real) return true;
    return isFakeOnline(profile.user_id);
  }, [isFakeOnline]);

  // Cleanup expired regularly
  useEffect(() => {
    const t = setInterval(() => {
      setFakeOnline(prev => {
        const now = Date.now();
        const next = new Map(prev);
        let changed = false;
        for (const [id, exp] of next) {
          if (exp <= now) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, CLEANUP_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  // Rotation loop
  useEffect(() => {
    const rotate = () => {
      const now = Date.now();
      const entries = Array.from(candidatesRef.current.entries());
      if (entries.length === 0) return;

      // Build candidate pool: not real online and not currently fake-online (or expired)
      const pool: string[] = [];
      for (const [id, isReal] of entries) {
        if (isReal) continue;
        const exp = fakeOnline.get(id);
        if (!exp || exp <= now) {
          pool.push(id);
        }
      }
      if (pool.length === 0) return;

      // Sample size
      const min = Math.min(BATCH_MIN, pool.length);
      const max = Math.min(BATCH_MAX, pool.length);
      const targetSize = Math.max(min, Math.min(max, Math.floor(Math.random() * (max - min + 1)) + min));

      // Shuffle and pick
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const pick = pool.slice(0, targetSize);

      // Apply new fake-online with expiry
      const expiresAt = now + DURATION_MS;
      setFakeOnline(prev => {
        const next = new Map(prev);
        for (const id of pick) {
          next.set(id, expiresAt);
        }
        return next;
      });
    };

    // Start interval
    const interval = setInterval(rotate, ROTATE_INTERVAL_MS);
    // Also perform an initial rotate shortly after mount to warm up
    const warmup = setTimeout(rotate, 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(warmup);
    };
  }, [fakeOnline]);

  const value = useMemo(() => ({ isFakeOnline, isOnlineOrFake, registerCandidates }), [isFakeOnline, isOnlineOrFake, registerCandidates]);

  return (
    <FakeOnlineContext.Provider value={value}>
      {children}
    </FakeOnlineContext.Provider>
  );
};

export const useFakeOnline = () => {
  const ctx = useContext(FakeOnlineContext);
  if (!ctx) throw new Error("useFakeOnline must be used within FakeOnlineProvider");
  return ctx;
};
