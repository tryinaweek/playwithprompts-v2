import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getPlayerId, setPlayerId } from './player';
import { supabase } from './supabase';

export interface SessionState {
  email: string | null;
  loading: boolean;
}

/**
 * Keeps the player id aligned with the signed-in account.
 *
 * A signed-in player's id IS their account id, so their streak follows them to
 * any device. Signing out returns the browser to anonymous play.
 */
export function useSession(): SessionState {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    /** Adopt the account id; refetch if this browser was using a different one. */
    const adopt = (userId: string, userEmail: string) => {
      const changed = getPlayerId() !== userId;
      setPlayerId(userId);
      setEmail(userEmail);
      if (changed) void queryClient.invalidateQueries();
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      if (user) adopt(user.id, user.email ?? '');
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const user = session?.user;
      if (user) adopt(user.id, user.email ?? '');
      else setEmail(null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  return { email, loading };
}
