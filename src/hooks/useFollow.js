import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { insertNotification } from '../utils/supabase-helpers';

export default function useFollow(currentUserId, targetUserId) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchFollowStats = useCallback(async (overrideTargetId = null) => {
    const idToUse = overrideTargetId || targetUserId;
    if (!idToUse) return;

    try {
      const { count: followers } = await supabase
        .from("follows")
        .eq("following_id", idToUse);

      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", idToUse);

      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
    } catch (error) {
      console.error("Error fetching follow stats:", error);
    }
  }, [targetUserId]);

  const checkFollowStatus = useCallback(async (overrideCurrentId = null, overrideTargetId = null) => {
    const cid = overrideCurrentId || currentUserId;
    const tid = overrideTargetId || targetUserId;
    if (!cid || !tid) return;

    try {
      const { data, error } = await supabase
        .from("follows")
        .select("*")
        .match({ follower_id: cid, following_id: tid });

      if (!error && data && data.length > 0) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  }, [currentUserId, targetUserId]);

  const toggleFollow = async () => {
    if (!currentUserId || !targetUserId || loading) return;

    setLoading(true);
    // Optimistic UI update
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);
    
    // Adjust counts optimistically if we are viewing the target's stats
    setFollowersCount(prev => isFollowing ? Math.max(0, prev - 1) : prev + 1);

    try {
      if (previousState) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .match({ follower_id: currentUserId, following_id: targetUserId });
        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: targetUserId });
        if (error) throw error;

        // Notification
        await insertNotification(currentUserId, targetUserId, 'follow', null, 'started following you');
      }
    } catch (error) {
      console.error("Follow error:", error);
      // Revert optimistic update
      setIsFollowing(previousState);
      setFollowersCount(prev => previousState ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setLoading(false);
    }
  };

  return { 
    isFollowing, 
    toggleFollow, 
    loading, 
    followersCount, 
    followingCount, 
    fetchFollowStats, 
    checkFollowStatus,
    setIsFollowing // expose in case of bulk list checks like ExplorePage
  };
}
