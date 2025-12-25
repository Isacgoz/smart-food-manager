import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadImage, imageToBase64 } from '../services/upload';
import { useToast } from '../hooks/useToast';

interface ImageUploadProps {
  currentImage?: string;
  restaurantId: string;
  productId?: string;
  onImageChange: (url: string) => void;
  label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  restaurantId,
  productId,
  onImageChange,
  label = "Photo du produit"
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notify } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Aperçu immédiat
      const localPreview = await imageToBase64(file);
      setPreview(localPreview);

      // Upload vers Supabase
      const result = await uploadImage(file, restaurantId, productId);

      if (result.success && result.url) {
        setPreview(result.url);
        onImageChange(result.url);
        notify("Image uploadée avec succès", "success");
      } else {
        // Fallback mode offline: utiliser base64
        onImageChange(localPreview);
        notify(result.error || "Mode offline: image locale", "warning");
      }
    } catch (err) {
      notify("Erreur lors de l'upload", "error");
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Aperçu"
            className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200"
          />
          <button
            onClick={handleRemove}
            disabled={uploading}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500 text-center px-2">
                Cliquer pour ajouter
                <br />
                <span className="text-xs">(JPEG, PNG, WEBP)</span>
              </span>
            </>
          )}
        </label>
      )}

      {uploading && (
        <p className="text-xs text-gray-500 italic">Upload en cours...</p>
      )}
    </div>
  );
};
