import React, { useEffect, useRef, useState } from 'react';
import { Monitor, AppWindow } from 'lucide-react';
import type { SourceInfo } from '../types';

interface SourcePickerProps {
  onSelect: (source: SourceInfo) => void;
  onCancel?: () => void;
}

type Tab = 'screens' | 'windows';

/**
 * SourcePicker — grid modal for choosing which screen/window to share.
 * Calls window.electronAPI.getSources() to enumerate sources.
 */
export default function SourcePicker({ onSelect, onCancel }: SourcePickerProps) {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('screens');
  const [selected, setSelected] = useState<SourceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await window.electronAPI.getSources();
        setSources(list);
      } catch (e: unknown) {
        setError((e as { message?: string })?.message ?? 'Failed to get sources');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = sources.filter((s) =>
    tab === 'screens' ? s.type === 'screen' : s.type === 'window',
  );

  const handleStart = () => {
    if (selected) onSelect(selected);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-[680px] max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] shrink-0">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Choose what to share
          </h2>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-[var(--bg-secondary)] rounded-lg p-1 w-fit">
            {(['screens', 'windows'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                  tab === t
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                {t === 'screens' ? (
                  <Monitor className="w-3.5 h-3.5" />
                ) : (
                  <AppWindow className="w-3.5 h-3.5" />
                )}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center h-40 text-[var(--text-muted)]">
              Loading sources…
            </div>
          )}
          {error && (
            <div className="text-[var(--danger)] text-sm text-center mt-10">
              {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex items-center justify-center h-40 text-[var(--text-muted)] text-sm">
              No {tab} found.
            </div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map((source) => {
                const isSelected = selected?.id === source.id;
                return (
                  <button
                    key={source.id}
                    onClick={() => setSelected(source)}
                    className={[
                      'flex flex-col rounded-xl overflow-hidden border-2 transition-all',
                      'bg-[var(--bg-secondary)] hover:border-indigo-500/60',
                      isSelected
                        ? 'border-[var(--accent)] ring-2 ring-indigo-500/30 shadow-indigo-500/20 shadow-lg'
                        : 'border-[var(--border)]',
                    ].join(' ')}
                  >
                    <div className="w-full aspect-video bg-black overflow-hidden">
                      {source.thumbnail ? (
                        <img
                          src={source.thumbnail}
                          alt={source.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                          <Monitor className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                    </div>
                    <div className="px-2.5 py-2 text-left">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {source.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--border)] flex justify-end gap-3 shrink-0">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleStart}
            disabled={!selected}
            className={[
              'px-5 py-2 rounded-lg text-sm font-semibold transition-colors',
              selected
                ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed',
            ].join(' ')}
          >
            Start Sharing
          </button>
        </div>
      </div>
    </div>
  );
}
