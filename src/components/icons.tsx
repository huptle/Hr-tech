import React from 'react';

export function HuptleMark({ size = 28, className = "" }: { size?: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="34" height="34" rx="4" fill="none" stroke="currentColor" strokeWidth="3.2"/>
      <rect x="11.5" y="10" width="5" height="20" fill="currentColor"/>
      <rect x="23.5" y="10" width="5" height="20" fill="currentColor"/>
      <rect x="11.5" y="17.5" width="17" height="5" fill="currentColor"/>
    </svg>
  );
}

export function HuptleWordmark({ height = 28, className = "" }: { height?: number, className?: string }) {
  const h = height;
  const w = h * 3.3;
  return (
    <svg width={w} height={h} viewBox="0 0 132 40" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="34" height="34" rx="4" fill="none" stroke="currentColor" strokeWidth="3.2"/>
      <rect x="11.5" y="10" width="5" height="20" fill="currentColor"/>
      <rect x="23.5" y="10" width="5" height="20" fill="currentColor"/>
      <rect x="11.5" y="17.5" width="17" height="5" fill="currentColor"/>
      <text x="46" y="29" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontSize="26" fontWeight="500" fill="currentColor" letterSpacing="-0.5">uptle</text>
    </svg>
  );
}

export function GoogleG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3A12 12 0 1 1 24 12a12 12 0 0 1 8.5 3.4l5.7-5.7A20 20 0 1 0 44 24a20 20 0 0 0-.4-3.5z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 8.5 3.4l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28.5l-6.5 5A20 20 0 0 0 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2A19.8 19.8 0 0 0 44 24a20 20 0 0 0-.4-3.5z"/>
    </svg>
  );
}
