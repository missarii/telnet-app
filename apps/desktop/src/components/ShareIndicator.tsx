import React from 'react';

interface ShareIndicatorProps {
  onStop: () => void;
}

/**
 * ShareIndicator — ALWAYS-VISIBLE floating badge when actively sharing.
 * Red pulsing dot + "LIVE" — click to stop.
 */
export default function ShareIndicator({ onStop }: ShareIndicatorProps) {
  return (
    <button
      onClick={onStop}
      aria-label="Stop sharing"
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-red-950/80 border-red-700 text-red-300 cursor-pointer hover:bg-red-900/90 transition-all duration-200 select-none"
    >
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      ● LIVE — Click to Stop
    </button>
  );
}
