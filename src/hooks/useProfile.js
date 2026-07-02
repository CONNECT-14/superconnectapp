import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export default function useProfile(identifier) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!identifier) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let profileData = null;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

      if (isUUID) {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', identifier)
          .single();
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        profileData = data;
      } else {
        const { data: byUsername } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', identifier)
          .single();
          
        if (byUsername) {
          profileData = byUsername;
        } else {
          const { data: byName } = await supabase
            .from('profiles')
            .select('*')
            .ilike('name', identifier)
            .single();
          if (byName) {
             profileData = byName;
          }
        }
      }

      setProfile(profileData);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}
