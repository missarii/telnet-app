import React from 'react';
import { useRoom } from '../hooks/useRoom';

interface ParticipantListProps {
  roomId: string;
  isHost?: boolean;
}

/**
 * ParticipantList — sidebar participant viewer (simplified for MVP).
 * Full list is loaded via the useRoom hook in production.
 */
export default function ParticipantList({ roomId, isHost = false }: ParticipantListProps) {
  const { getParticipants } = useRoom();
  const [participants, setParticipants] = React.useState<import('../types').Participant[]>([]);

  React.useEffect(() => {
    getParticipants(roomId).then(setParticipants);
    const interval = setInterval(() => {
      getParticipants(roomId).then(setParticipants);
    }, 5000);
    return () => clearInterval(interval);
  }, [roomId, getParticipants]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Viewers ({participants.filter((p) => p.role === 'viewer').length})
        </h3>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {participants.length === 0 ? (
          <li className="flex flex-col items-center justify-center h-32 gap-2 text-xs text-[var(--muted)] px-4 text-center">
            <svg className="w-6 h-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Share your invite code to let viewers join
          </li>
        ) : (
          participants.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]/50">
              <div className="w-7 h-7 rounded-full bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-indigo-300">
                  {p.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{p.displayName}</p>
                <p className="text-[10px] text-[var(--muted)]">{p.role}</p>
              </div>
              <span className={`w-1.5 h-1.5 rounded-full ${p.isConnected ? 'bg-emerald-400' : 'bg-[var(--muted)]'}`} />
            </li>
          ))
        )}
      </ul>
      {isHost && participants.length === 0 && (
        <div className="p-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted)] text-center">
            Waiting for viewers…
          </p>
        </div>
      )}
    </div>
  );
}
