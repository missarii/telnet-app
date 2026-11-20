import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface StopSharingModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * StopSharingModal — confirmation dialog before ending a session.
 */
export default function StopSharingModal({
  onConfirm,
  onCancel,
}: StopSharingModalProps) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      {/* Dialog */}
      <div
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-7 w-[22rem] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-modal-title"
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="stop-modal-title"
          className="text-center text-base font-semibold text-[var(--text-primary)] mb-2"
        >
          Stop sharing your screen?
        </h2>
        <p className="text-center text-sm text-[var(--text-muted)] mb-6">
          All viewers will lose access immediately.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-[var(--danger)] hover:bg-red-600 text-sm font-semibold text-white transition-colors"
          >
            Stop Sharing
          </button>
        </div>
      </div>
    </div>
  );
}
