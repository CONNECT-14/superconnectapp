import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../supabaseClient';

export default function useImageUpload(bucketName) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const upload = async (file, pathPrefix = '') => {
    if (!file) return null;

    setUploading(true);
    setError(null);
    let finalFile = file;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    try {
      finalFile = await imageCompression(file, options);
    } catch (e) {
      console.error("Image compression error:", e);
      // Fallback to original file if compression fails
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${pathPrefix}${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, finalFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
