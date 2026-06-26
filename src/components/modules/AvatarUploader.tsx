'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface AvatarUploaderProps {
  email: string;
  profileId: string;
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  compact?: boolean;
}

function getInitials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/);
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 400;
        const maxHeight = 400;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/webp',
          0.8
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

export default function AvatarUploader({
  email,
  profileId,
  currentAvatarUrl,
  onUploadSuccess,
  compact = false,
}: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = getInitials(email);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size is too large (max 50MB for original)');
      return;
    }

    try {
      setUploading(true);

      const compressed = await compressImage(file);

      if (compressed.size > 2 * 1024 * 1024) {
        setError('Image is too large after compression (max 2MB)');
        setUploading(false);
        return;
      }

      const supabase = createClient();

      const fileExt = 'webp';
      const fileName = `${profileId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressed, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError(`Upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await (supabase.from('profiles') as any)
        .update({ avatar_url: publicUrl })
        .eq('id', profileId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        setError(`Failed to save profile: ${updateError.message}`);
        setUploading(false);
        return;
      }

      setPreview(publicUrl);
      setSuccess('Profile picture updated successfully!');

      if (onUploadSuccess) {
        onUploadSuccess(publicUrl);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload image';
      console.error('Upload error:', err);
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const avatarSize = compact ? 'w-14 h-14' : 'w-20 h-20';

  return (
    <div className={`flex flex-col items-center gap-4 ${compact ? 'gap-3' : ''}`}>
      <div className="relative">
        {preview ? (
          <img
            src={preview}
            alt={email}
            className={`${avatarSize} rounded-full object-cover border-2 border-brand`}
          />
        ) : (
          <div
            className={`${avatarSize} rounded-full bg-brand text-cream-white flex items-center justify-center font-bold border-2 border-brand ${
              compact ? 'text-sm' : 'text-xl'
            }`}
          >
            {initials}
          </div>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 rounded-full bg-coffee p-2 text-cream-white transition-colors hover:bg-brand disabled:opacity-50 active:scale-[0.92]"
          title="Upload new picture"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />

      {uploading && <p className="text-sm text-ink-muted">Uploading...</p>}

      {error && <p className="text-sm text-danger text-center">{error}</p>}

      {success && <p className="text-sm text-success text-center">{success}</p>}

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-sm text-brand hover:underline disabled:opacity-50"
      >
        {preview ? 'Change Picture' : 'Upload Picture'}
      </button>
    </div>
  );
}
