import React from 'react';

interface ConnectionStatusProps {
  state: 'connected' | 'disconnected' | 'connecting' | 'reconnecting';
  latency: number;
}

export default function ConnectionStatus({ state, latency }: ConnectionStatusProps) {
  if (state === 'connected') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Connected{latency > 0 ? ` · ${latency}ms` : ''}
      </div>
    );
  }
  if (state === 'connecting' || state === 'reconnecting') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        {state === 'reconnecting' ? 'Reconnecting…' : 'Connecting…'}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]" />
      Not connected
    </div>
  );
}
