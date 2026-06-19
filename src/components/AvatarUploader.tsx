'use client';

interface AvatarUploaderProps {
  onUpload?: (file: File) => void;
}

export default function AvatarUploader({ onUpload }: AvatarUploaderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <label className="block">
        <span className="font-semibold text-red-bean mb-2 block">
          Upload Profile Picture
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-bean"
        />
      </label>
    </div>
  );
}
