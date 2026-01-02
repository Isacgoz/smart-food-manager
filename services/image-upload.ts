/**
 * Image Upload Service - Supabase Storage
 * Upload images produits vers cloud (remplace URL string)
 */

import { supabase } from './storage';
import { logger } from '../shared/services/logger';

const BUCKET_NAME = 'product-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Initialiser bucket Supabase (une seule fois au setup)
 */
export const initStorageBucket = async (): Promise<boolean> => {
  if (!supabase) return false;

  try {
    // Vérifier si bucket existe
    const { data: buckets } = await supabase.storage.listBuckets();

    if (!buckets?.find(b => b.name === BUCKET_NAME)) {
      // Créer bucket public
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_TYPES
      });

      if (error) throw error;
      logger.info('Storage bucket created', { bucket: BUCKET_NAME });
    }

    return true;
  } catch (err) {
    logger.error('Failed to init storage bucket', err as Error);
    return false;
  }
};

/**
 * Upload image produit vers Supabase Storage
 */
export const uploadProductImage = async (
  file: File,
  companyId: string,
  productId: string
): Promise<UploadResult> => {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré - Mode offline'
    };
  }

  // Validation fichier
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Format non supporté. Utilisez: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
    };
  }

  try {
    // Nom fichier: company_id/product_id.extension
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${companyId}/${productId}.${ext}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Écraser si existe déjà
      });

    if (error) throw error;

    // Récupérer URL publique
    const { data: publicUrl } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    logger.info('Image uploaded', { productId, path: filePath });

    return {
      success: true,
      url: publicUrl.publicUrl
    };
  } catch (err) {
    logger.error('Image upload failed', err as Error, { productId });
    return {
      success: false,
      error: (err as Error).message
    };
  }
};

/**
 * Supprimer image produit
 */
export const deleteProductImage = async (
  companyId: string,
  productId: string,
  imageUrl: string
): Promise<boolean> => {
  if (!supabase || !imageUrl.includes(BUCKET_NAME)) return false;

  try {
    // Extraire path depuis URL
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;

    logger.info('Image deleted', { productId, path: filePath });
    return true;
  } catch (err) {
    logger.error('Image deletion failed', err as Error, { productId });
    return false;
  }
};

/**
 * Optimiser image avant upload (compression côté client)
 */
export const optimizeImage = async (
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionner proportionnellement
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Blob conversion failed'));
              return;
            }

            // Créer nouveau File
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            resolve(optimizedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = reject;
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Composant React pour upload (hook)
 */
export const useImageUpload = (companyId: string, productId: string) => {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const upload = async (file: File): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Optimiser avant upload
      const optimized = await optimizeImage(file);
      setProgress(50);

      // Upload
      const result = await uploadProductImage(optimized, companyId, productId);
      setProgress(100);

      if (!result.success) {
        setError(result.error || 'Upload failed');
      }

      return result;
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return { upload, uploading, progress, error };
};

// Export hook si React disponible
import React from 'react';
