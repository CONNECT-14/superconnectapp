import { supabase } from '../supabaseClient';

export async function insertNotification(fromUserId, toUserId, type, postId = null, message = '', projectId = null, collabRequestId = null) {
  if (fromUserId === toUserId) return { data: null, error: null }; // Don't notify self

  try {
    const payload = {
      user_id: toUserId,
      from_user_id: fromUserId,
      type,
      message,
    };
    if (postId) {
      payload.post_id = postId;
    }
    if (projectId) {
      payload.project_id = projectId;
    }
    if (collabRequestId) {
      payload.collab_request_id = collabRequestId;
    }

    return await supabase.from('notifications').insert(payload);
  } catch (error) {
    console.error("Error inserting notification:", error);
    return { data: null, error };
  }
}

export function generateUsernameSlug(name) {
  if (!name) return "user_" + Math.floor(Math.random() * 10000);
  let slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '');
  if (!slug || slug.length < 3) slug = "user_" + Math.floor(Math.random() * 10000);
  return slug + Math.floor(Math.random() * 10000);
}
