import { supabase } from '../../services/storage';
import { logger } from './logger';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

const BUCKET_NAME = 'product-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export const uploadImage = async (
  file: File,
  restaurantId: string,
  productId?: string
): Promise<UploadResult> => {
  try {
    // Validation taille
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('Image trop volumineuse', { size: file.size, max: MAX_FILE_SIZE });
      return {
        success: false,
        error: 'Image trop volumineuse (max 5MB)'
      };
    }

    // Validation type
    if (!ALLOWED_TYPES.includes(file.type)) {
      logger.warn('Type fichier non autorisé', { type: file.type });
      return {
        success: false,
        error: 'Format non supporté (JPEG, PNG, WEBP uniquement)'
      };
    }

    // Générer nom unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const extension = file.name.split('.').pop();
    const fileName = productId
      ? `${restaurantId}/${productId}_${timestamp}.${extension}`
      : `${restaurantId}/temp_${randomStr}.${extension}`;

    // Upload vers Supabase Storage
    if (!supabase) {
      logger.error('Supabase non configuré pour upload');
      return {
        success: false,
        error: 'Service upload non disponible (mode offline)'
      };
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      logger.error('Erreur upload Supabase', error, { fileName });
      return {
        success: false,
        error: `Échec upload: ${error.message}`
      };
    }

    // Générer URL publique
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    logger.info('Image uploadée avec succès', { fileName, url: publicUrlData.publicUrl });

    return {
      success: true,
      url: publicUrlData.publicUrl
    };
  } catch (err) {
    logger.error('Exception upload image', err as Error);
    return {
      success: false,
      error: 'Erreur inattendue lors de l\'upload'
    };
  }
};

export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    if (!supabase) {
      logger.warn('Supabase non configuré pour suppression');
      return false;
    }

    // Extraire path depuis URL
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      logger.warn('URL image invalide', { url: imageUrl });
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      logger.error('Erreur suppression image', error, { filePath });
      return false;
    }

    logger.info('Image supprimée', { filePath });
    return true;
  } catch (err) {
    logger.error('Exception suppression image', err as Error);
    return false;
  }
};

// Fallback: conversion base64 pour mode offline
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
