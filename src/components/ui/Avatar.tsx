import React from 'react';
import { firstLetter, avatarColor } from '@/lib/avatar';

// Initial-letter avatar: a colored circle with the user's first letter.
export default function Avatar({
  name,
  seed,
  size = 44,
  className = '',
}: {
  name?: string;
  seed?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold select-none shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        backgroundColor: avatarColor(seed || name),
      }}
      aria-label={name}
    >
      {firstLetter(name)}
    </div>
  );
}
