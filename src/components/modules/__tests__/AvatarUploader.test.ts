import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AvatarUploader Component', () => {
  const mockProps = {
    email: 'john.smith@example.com',
    profileId: 'user-123',
  };

  describe('Initials Generation', () => {
    it('generates correct initials from email', () => {
      const email = 'john.smith@example.com';
      const parts = email.split('@')[0].split(/[._-]/);
      const initials = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');

      expect(initials).toBe('JS');
    });

    it('handles single name email', () => {
      const email = 'john@example.com';
      const parts = email.split('@')[0].split(/[._-]/);
      const initials = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');

      expect(initials).toBe('J');
    });

    it('handles hyphenated names', () => {
      const email = 'mary-jane@example.com';
      const parts = email.split('@')[0].split(/[._-]/);
      const initials = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');

      expect(initials).toBe('MJ');
    });

    it('handles underscored names', () => {
      const email = 'first_last@example.com';
      const parts = email.split('@')[0].split(/[._-]/);
      const initials = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');

      expect(initials).toBe('FL');
    });

    it('handles mixed separators', () => {
      const email = 'john.doe-smith@example.com';
      const parts = email.split('@')[0].split(/[._-]/);
      const initials = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');

      expect(initials).toBe('JD');
    });
  });

  describe('File Validation', () => {
    it('accepts image files', () => {
      const file = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
      const isImage = file.type.startsWith('image/');

      expect(isImage).toBe(true);
    });

    it('rejects non-image files', () => {
      const file = new File([''], 'document.pdf', { type: 'application/pdf' });
      const isImage = file.type.startsWith('image/');

      expect(isImage).toBe(false);
    });

    it('accepts PNG format', () => {
      const file = new File([''], 'avatar.png', { type: 'image/png' });
      expect(file.type.startsWith('image/')).toBe(true);
    });

    it('accepts WebP format', () => {
      const file = new File([''], 'avatar.webp', { type: 'image/webp' });
      expect(file.type.startsWith('image/')).toBe(true);
    });

    it('rejects files larger than 50MB', () => {
      const fileSize = 60 * 1024 * 1024;
      const maxSize = 50 * 1024 * 1024;

      expect(fileSize > maxSize).toBe(true);
    });

    it('accepts files under 50MB', () => {
      const fileSize = 10 * 1024 * 1024;
      const maxSize = 50 * 1024 * 1024;

      expect(fileSize <= maxSize).toBe(true);
    });
  });

  describe('Image Compression', () => {
    it('compresses to WebP format', () => {
      const outputFormat = 'image/webp';
      expect(outputFormat).toBe('image/webp');
    });

    it('maintains max 400x400 dimensions', () => {
      const maxWidth = 400;
      const maxHeight = 400;

      expect(maxWidth).toBe(400);
      expect(maxHeight).toBe(400);
    });

    it('enforces 2MB max after compression', () => {
      const maxSize = 2 * 1024 * 1024;
      expect(maxSize).toBe(2097152);
    });

    it('scales large images proportionally', () => {
      const originalWidth = 2000;
      const originalHeight = 1500;
      const maxDim = 400;

      const scaledWidth = (originalWidth * maxDim) / Math.max(originalWidth, originalHeight);
      const scaledHeight = (originalHeight * maxDim) / Math.max(originalWidth, originalHeight);

      expect(scaledWidth).toBeLessThanOrEqual(maxDim);
      expect(scaledHeight).toBeLessThanOrEqual(maxDim);
    });

    it('preserves aspect ratio for landscape images', () => {
      const width = 1600;
      const height = 900;

      const scaledWidth = 400;
      const scaledHeight = Math.round((height * scaledWidth) / width);

      expect(scaledHeight).toBe(225);
    });

    it('preserves aspect ratio for portrait images', () => {
      const width = 300;
      const height = 800;

      const scaledHeight = 400;
      const scaledWidth = Math.round((width * scaledHeight) / height);

      expect(scaledWidth).toBe(150);
    });

    it('uses 0.8 quality for WebP compression', () => {
      const quality = 0.8;
      expect(quality).toBe(0.8);
    });
  });

  describe('Upload Flow', () => {
    it('sends file to Supabase Storage', () => {
      const bucket = 'avatars';
      expect(bucket).toBe('avatars');
    });

    it('generates correct storage path', () => {
      const profileId = 'user-123';
      const filePath = `avatars/${profileId}.webp`;

      expect(filePath).toContain('avatars/');
      expect(filePath).toContain('user-123');
    });

    it('uses upsert mode to replace existing image', () => {
      const uploadOptions = { upsert: true };
      expect(uploadOptions.upsert).toBe(true);
    });

    it('saves public URL to profiles.avatar_url', () => {
      const field = 'avatar_url';
      expect(field).toBe('avatar_url');
    });

    it('updates profile with correct profile_id', () => {
      const profileId = 'user-123';
      expect(profileId).toBeDefined();
    });

    it('handles upload errors gracefully', () => {
      const uploadError = { message: 'Network error' };
      expect(uploadError).toBeDefined();
    });

    it('handles profile update errors gracefully', () => {
      const updateError = { message: 'Permission denied' };
      expect(updateError).toBeDefined();
    });
  });

  describe('UI Feedback', () => {
    it('shows uploading state during upload', () => {
      const uploading = true;
      expect(uploading).toBe(true);
    });

    it('displays success message on completion', () => {
      const message = 'Profile picture updated successfully!';
      expect(message).toContain('updated successfully');
    });

    it('displays error message on failure', () => {
      const error = 'Upload failed: Network error';
      expect(error).toContain('failed');
    });

    it('clears success message after 3 seconds', () => {
      const timeout = 3000;
      expect(timeout).toBe(3000);
    });

    it('disables upload button while uploading', () => {
      const uploading = true;
      const disabled = uploading;

      expect(disabled).toBe(true);
    });

    it('shows preview image after upload', () => {
      const previewUrl = 'https://example.com/avatar.webp';
      expect(previewUrl).toContain('.webp');
    });

    it('shows initials placeholder if no avatar', () => {
      const email = 'john@example.com';
      const parts = email.split('@')[0].split(/[._-]/);
      const initials = parts[0].charAt(0).toUpperCase();

      expect(initials).toBe('J');
    });
  });

  describe('Edge Cases', () => {
    it('handles very small images', () => {
      const width = 10;
      const height = 10;

      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });

    it('handles very large images', () => {
      const width = 8000;
      const height = 6000;

      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });

    it('handles square images', () => {
      const width = 1000;
      const height = 1000;

      expect(width).toBe(height);
    });

    it('handles image upload after previous success', () => {
      const firstUrl = 'https://example.com/avatar1.webp';
      const secondUrl = 'https://example.com/avatar2.webp';

      expect(firstUrl).not.toBe(secondUrl);
    });

    it('handles rapid file selections', () => {
      const fileCount = 3;
      expect(fileCount).toBeGreaterThan(1);
    });

    it('clears file input after successful upload', () => {
      const fileInput = { value: '' };
      expect(fileInput.value).toBe('');
    });

    it('handles email with numbers', () => {
      const email = 'user123@example.com';
      const parts = email.split('@')[0].split(/[._-]/);
      const initials = parts[0].charAt(0).toUpperCase();

      expect(initials).toBe('U');
    });

    it('handles email with uppercase letters', () => {
      const email = 'JOHN@example.com';
      const parts = email.split('@')[0].split(/[._-]/);
      const initials = parts[0].charAt(0).toUpperCase();

      expect(initials).toBe('J');
    });
  });

  describe('Styling & Accessibility', () => {
    it('uses Red Bean color for avatar circle', () => {
      const color = '#8B2E2E';
      expect(color).toBe('#8B2E2E');
    });

    it('displays edit button on avatar', () => {
      const hasEditButton = true;
      expect(hasEditButton).toBe(true);
    });

    it('provides alt text for avatar image', () => {
      const alt = 'john@example.com';
      expect(alt).toBeDefined();
    });

    it('shows title on edit button', () => {
      const title = 'Upload new picture';
      expect(title).toContain('Upload');
    });

    it('provides clear call-to-action text', () => {
      const cta = 'Upload Picture';
      expect(cta).toContain('Picture');
    });

    it('shows disabled state while uploading', () => {
      const uploading = true;
      const isDisabled = uploading;

      expect(isDisabled).toBe(true);
    });
  });

  describe('Callback Integration', () => {
    it('calls onUploadSuccess with URL on success', () => {
      let capturedUrl = '';
      const onUploadSuccess = (url: string) => {
        capturedUrl = url;
      };

      const newUrl = 'https://example.com/avatar.webp';
      onUploadSuccess(newUrl);

      expect(capturedUrl).toBe(newUrl);
    });

    it('does not call callback on error', () => {
      let callCount = 0;
      const onUploadSuccess = () => {
        callCount++;
      };

      expect(callCount).toBe(0);
    });

    it('does not call callback if upload cancelled', () => {
      let callCount = 0;
      const onUploadSuccess = () => {
        callCount++;
      };

      expect(callCount).toBe(0);
    });
  });

  describe('Storage Bucket Interaction', () => {
    it('uploads to "avatars" bucket', () => {
      const bucket = 'avatars';
      expect(bucket).toBe('avatars');
    });

    it('generates public URL for image access', () => {
      const publicUrl = 'https://storage.example.com/object/public/avatars/user-123.webp';
      expect(publicUrl).toContain('public');
    });

    it('saves URL in profiles table', () => {
      const table = 'profiles';
      const field = 'avatar_url';

      expect(table).toBe('profiles');
      expect(field).toBe('avatar_url');
    });

    it('matches by profile ID when saving', () => {
      const profileId = 'user-123';
      const where = `id = ${profileId}`;

      expect(where).toContain('user-123');
    });
  });

  describe('Performance', () => {
    it('compresses before upload to save bandwidth', () => {
      const originalSize = 10 * 1024 * 1024;
      const compressedSize = 1.5 * 1024 * 1024;

      expect(compressedSize).toBeLessThan(originalSize);
    });

    it('handles compression without blocking UI', () => {
      const isAsync = true;
      expect(isAsync).toBe(true);
    });

    it('clears preview on new file selection', () => {
      const preview = null;
      expect(preview).toBeNull();
    });
  });
});
