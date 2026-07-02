import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching auth session:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return { user, session, loading };
}
