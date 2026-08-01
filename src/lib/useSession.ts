import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { linkAccount } from './api';
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
 * any device. Adoption of this browser's anonymous history happens here rather
 * than in the sign-in form, because Google sign-in leaves the page and comes
 * back — there is no form still mounted to do it.
 */
export function useSession(): SessionState {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const adopt = async (userId: string, userEmail: string, accessToken: string | undefined) => {
      const previousId = getPlayerId();
      const changed = previousId !== userId;
      setEmail(userEmail);
      if (!changed) return;

      // Carry this device's anonymous rounds onto the account before switching
      // ids, so the streak survives sign-in. Safe to repeat: the server ignores
      // duplicates.
      if (accessToken) {
        try {
          await linkAccount(accessToken);
        } catch {
          // Never block sign-in on adoption — the account itself still works.
        }
      }
      setPlayerId(userId);
      void queryClient.invalidateQueries();
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      if (session?.user) {
        void adopt(session.user.id, session.user.email ?? '', session.access_token);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        void adopt(session.user.id, session.user.email ?? '', session.access_token);
      } else {
        setEmail(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  return { email, loading };
}
