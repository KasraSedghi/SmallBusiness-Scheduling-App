import React from 'react';

interface AvatarDisplayProps {
  email: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getInitials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/);
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-20 h-20 text-xl',
};

export default function AvatarDisplay({
  email,
  avatarUrl,
  size = 'md',
  className = '',
}: AvatarDisplayProps) {
  const initials = getInitials(email);
  const sizeClass = sizeClasses[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={email}
        className={`rounded-full object-cover border-2 border-red-bean ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-red-bean text-white flex items-center justify-center font-bold border-2 border-red-bean ${sizeClass} ${className}`}
    >
      {initials}
    </div>
  );
}
