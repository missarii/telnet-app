import React, { useState } from 'react';
import Layout from './components/Layout';
import ShareIndicator from './components/ShareIndicator';
import SourcePicker from './components/SourcePicker';
import VideoPreview from './components/VideoPreview';
import RoomCard from './components/RoomCard';
import ParticipantList from './components/ParticipantList';
import ConnectionStatus from './components/ConnectionStatus';
import StopSharingModal from './components/StopSharingModal';
import { useShareIndicator } from './hooks/useShareIndicator';
import { useRoom } from './hooks/useRoom';
import type { SourceInfo, Room } from './types';

type AppView = 'home' | 'create' | 'join' | 'session';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [inviteCode, setInviteCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceInfo | null>(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);

  const { isSharing, startSharing, stopSharing } = useShareIndicator();
  const { loading, error, createRoom, joinRoom, clearError } = useRoom();

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    try {
      const room = await createRoom(roomName.trim(), 10);
      setCurrentRoom(room);
      setView('session');
    } catch {
      // error shown via `error` state
    }
  };

  const handleJoinRoom = async () => {
    if (!inviteCode.trim()) return;
    try {
      const room = await joinRoom(inviteCode.trim().toUpperCase());
      setCurrentRoom(room);
      setView('session');
    } catch {
      // error shown via `error` state
    }
  };

  const handleSourceSelected = (source: SourceInfo) => {
    setSelectedSource(source);
    setShowSourcePicker(false);
    startSharing();
  };

  const handleStopSharing = () => {
    setShowStopModal(false);
    stopSharing();
    setSelectedSource(null);
  };

  const handleLeaveSession = () => {
    if (isSharing) {
      stopSharing();
    }
    setCurrentRoom(null);
    setSelectedSource(null);
    setView('home');
  };

  // ── Views ───────────────────────────────────────────────────────────────────

  if (view === 'session' && currentRoom) {
    return (
      <Layout>
        {isSharing && (
          <ShareIndicator onStop={() => setShowStopModal(true)} />
        )}

        <div className="flex h-full">
          {/* Main video area */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div>
                <h2 className="font-semibold text-white">{currentRoom.name}</h2>
                <p className="text-xs text-[var(--muted)]">
                  Code: <span className="font-mono text-[var(--accent)]">{currentRoom.inviteCode}</span>
                  {' · '}
                  <button
                    onClick={() => navigator.clipboard.writeText(currentRoom.inviteCode)}
                    className="underline hover:text-white transition-colors"
                  >
                    Copy
                  </button>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ConnectionStatus state={isSharing ? 'connected' : 'disconnected'} latency={0} />
                {!isSharing ? (
                  <button
                    onClick={() => setShowSourcePicker(true)}
                    className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Start Sharing
                  </button>
                ) : (
                  <button
                    onClick={() => setShowStopModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors"
                  >
                    Stop Sharing
                  </button>
                )}
                <button
                  onClick={handleLeaveSession}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--muted)] rounded-lg text-sm hover:text-white hover:border-white transition-colors"
                >
                  Leave
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
              {isSharing && selectedSource ? (
                <VideoPreview sourceId={selectedSource.id} sourceName={selectedSource.name} />
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-[var(--muted)]">No screen sharing active</p>
                  <button
                    onClick={() => setShowSourcePicker(true)}
                    className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Choose Screen to Share
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-64 border-l border-[var(--border)] flex flex-col">
            <ParticipantList roomId={currentRoom.id} isHost={true} />
          </div>
        </div>

        {showSourcePicker && (
          <SourcePicker
            onSelect={handleSourceSelected}
            onCancel={() => setShowSourcePicker(false)}
          />
        )}

        {showStopModal && (
          <StopSharingModal
            onConfirm={handleStopSharing}
            onCancel={() => setShowStopModal(false)}
          />
        )}
      </Layout>
    );
  }

  // ── Home ─────────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white tracking-tight mb-2">
            tel<span className="text-[var(--accent)]">net</span>
          </h1>
          <p className="text-[var(--muted)]">Your screen, shared privately.</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Video only · No mic · No camera
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Create room */}
          <RoomCard
            title="Start a Session"
            description="Create a private room and share your invite code."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            {view === 'create' ? (
              <div className="space-y-3 mt-4">
                <input
                  autoFocus
                  type="text"
                  placeholder="Room name, e.g. Coding Help"
                  value={roomName}
                  onChange={(e) => { setRoomName(e.target.value); clearError(); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateRoom}
                    disabled={loading || !roomName.trim()}
                    className="flex-1 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    {loading ? 'Creating…' : 'Create Room'}
                  </button>
                  <button
                    onClick={() => setView('home')}
                    className="px-3 py-2 border border-[var(--border)] text-[var(--muted)] rounded-lg text-sm hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setView('create')}
                className="mt-4 w-full py-2.5 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Create Private Room
              </button>
            )}
          </RoomCard>

          {/* Join room */}
          <RoomCard
            title="Join a Session"
            description="Enter an invite code to watch someone's screen."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            }
          >
            {view === 'join' ? (
              <div className="space-y-3 mt-4">
                <input
                  autoFocus
                  type="text"
                  placeholder="TEL-XXXXX"
                  value={inviteCode}
                  onChange={(e) => { setInviteCode(e.target.value); clearError(); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white placeholder-[var(--muted)] font-mono focus:outline-none focus:border-[var(--accent)]"
                />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleJoinRoom}
                    disabled={loading || !inviteCode.trim()}
                    className="flex-1 py-2 bg-[var(--surface)] border border-[var(--border)] text-white rounded-lg text-sm font-medium hover:border-[var(--accent)] disabled:opacity-40 transition-colors"
                  >
                    {loading ? 'Joining…' : 'Join Room'}
                  </button>
                  <button
                    onClick={() => setView('home')}
                    className="px-3 py-2 border border-[var(--border)] text-[var(--muted)] rounded-lg text-sm hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setView('join')}
                className="mt-4 w-full py-2.5 bg-[var(--surface)] border border-[var(--border)] text-white rounded-lg text-sm font-medium hover:border-[var(--accent)] transition-colors"
              >
                Enter Invite Code
              </button>
            )}
          </RoomCard>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-[var(--muted)]">
          Telnet Desktop · v0.1.0 · Private by design
        </p>
      </div>
    </Layout>
  );
};

export default App;
