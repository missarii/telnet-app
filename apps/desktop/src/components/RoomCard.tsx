import React from 'react';

interface RoomCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * RoomCard — a simple card container for home-screen actions.
 */
export default function RoomCard({ title, description, icon, children }: RoomCardProps) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">{title}</h3>
        </div>
      </div>
      <p className="text-xs text-[var(--muted)] mb-1">{description}</p>
      {children}
    </div>
  );
}
