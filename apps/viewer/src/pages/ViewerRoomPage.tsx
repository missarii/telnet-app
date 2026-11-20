import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Monitor,
  Users,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Pause,
  Play,
  Wifi,
  WifiOff,
  Loader2,
  X,
  Send,
  ArrowLeft,
} from 'lucide-react';
import { useViewerWebRTC } from '../hooks/useViewerWebRTC';
import { getLivekitToken, getRoomByInviteCode } from '../services/api';
import type { Room, ChatMessage, ConnectionState } from '../types';

// ─── Utility ──────────────────────────────────────────────────────────────────

function qualityColor(q: string): string {
  if (q === 'excellent') return 'text-green-400';
  if (q === 'good') return 'text-yellow-400';
  if (q === 'poor') return 'text-red-400';
  return 'text-muted';
}

function connectionLabel(s: ConnectionState): string {
  switch (s) {
    case 'connected': return 'Live';
    case 'connecting': return 'Connecting…';
    case 'reconnecting': return 'Reconnecting…';
    case 'failed': return 'Failed';
    default: return 'Disconnected';
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ViewerRoomPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();

  // Room metadata
  const [room, setRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string>('');
  const [livekitUrl, setLivekitUrl] = useState<string>('');
  const [initError, setInitError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Video element
  const videoRef = useRef<HTMLVideoElement>(null);

  // UI state
  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch room + token
  useEffect(() => {
    if (!inviteCode) return;
    (async () => {
      try {
        const r = await getRoomByInviteCode(inviteCode);
        setRoom(r);
        const tokenData = await getLivekitToken(r.id, 'viewer-' + Math.random().toString(36).slice(2, 8));
        setToken(tokenData.token);
        setLivekitUrl(tokenData.livekitUrl);
      } catch (err: unknown) {
        const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
        const msg =
          anyErr?.response?.data?.message ||
          anyErr?.message ||
          'Room not found or access denied.';
        setInitError(typeof msg === 'string' ? msg : 'Room not found or access denied.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [inviteCode]);

  // WebRTC hook
  const { videoTrack, connectionState, participants, latency, quality } = useViewerWebRTC(
    livekitUrl,
    token,
    !!token && !!livekitUrl,
  );

  // Attach video track to element
  useEffect(() => {
    if (!videoRef.current || !videoTrack) return;
    videoTrack.attach(videoRef.current);
    return () => {
      videoTrack.detach();
    };
  }, [videoTrack]);

  // Freeze frame: pause/resume
  useEffect(() => {
    if (!videoRef.current) return;
    if (isFrozen) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isFrozen]);

  // Fullscreen sync
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Auto-hide controls
  const revealControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // Actions
  const toggleFullscreen = useCallback(async () => {
    const container = document.getElementById('viewer-container');
    if (!container) return;
    if (!document.fullscreenElement) {
      await container.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 3.0)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.5)), []);
  const toggleFreeze = useCallback(() => setIsFrozen((f) => !f), []);

  const sendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      roomId: room?.id ?? '',
      senderId: 'viewer',
      senderName: 'You',
      text,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, msg]);
    setChatInput('');
  }, [chatInput, room]);

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
          <p className="text-sm">Joining room…</p>
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────

  if (initError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Cannot join room</h2>
          <p className="text-muted text-sm max-w-xs">{initError}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-accent hover:text-accent-hover text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>
      </div>
    );
  }

  const isConnected = connectionState === 'connected';
  const isReconnecting = connectionState === 'reconnecting' || connectionState === 'connecting';

  // ─── Main View ──────────────────────────────────────────────────────────────

  return (
    <div
      id="viewer-container"
      className="min-h-screen bg-black flex flex-col relative select-none"
      onMouseMove={revealControls}
    >
      {/* ── Status Bar ── */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${
          showControls || !isConnected ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Left: Room name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-accent" />
            <span className="text-white text-sm font-medium">{room?.name ?? inviteCode}</span>
          </div>
          {/* Live indicator */}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isConnected
                ? 'bg-green-500/20 text-green-400'
                : isReconnecting
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {connectionLabel(connectionState)}
          </span>
        </div>

        {/* Right: Stats + toggles */}
        <div className="flex items-center gap-4">
          {/* Latency */}
          {latency > 0 && (
            <span className="text-xs text-muted">
              {latency < 1000 ? `${latency}ms` : `>1s`}
            </span>
          )}
          {/* Quality */}
          <span className={`text-xs font-medium capitalize ${qualityColor(quality)}`}>
            {quality}
          </span>
          {/* Viewer count */}
          <div className="flex items-center gap-1 text-muted text-xs">
            <Users className="w-3.5 h-3.5" />
            <span>{participants.length}</span>
          </div>
          {/* Sidebar toggles */}
          <button
            onClick={() => { setShowParticipants((v) => !v); setShowChat(false); }}
            className={`p-1.5 rounded-lg transition-colors ${showParticipants ? 'bg-accent text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowChat((v) => !v); setShowParticipants(false); }}
            className={`p-1.5 rounded-lg transition-colors ${showChat ? 'bg-accent text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 relative">
        {/* Video */}
        <div className="flex-1 flex items-center justify-center overflow-hidden bg-black relative">
          {videoTrack ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted">
              <Monitor className="w-16 h-16 opacity-20" />
              <p className="text-sm opacity-50">
                {isReconnecting ? 'Connecting to stream…' : 'Waiting for host to share…'}
              </p>
            </div>
          )}

          {/* Freeze frame overlay */}
          {isFrozen && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-yellow-300 text-xs font-bold tracking-widest px-4 py-2 rounded-full border border-yellow-500/30 uppercase">
              PAUSED — Inspecting Frame
            </div>
          )}
        </div>

        {/* Participant Sidebar */}
        {showParticipants && (
          <aside className="w-64 bg-surface border-l border-border flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium text-foreground">Participants</span>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {participants.length === 0 ? (
                <p className="text-muted text-xs text-center py-8">No participants yet</p>
              ) : (
                participants.map((p) => (
                  <div
                    key={p.sid}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-background/60 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold uppercase flex-shrink-0">
                      {(p.name ?? 'U')[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{p.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted">
                        {p.isLocal ? 'You' : 'Viewer'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Chat Sidebar */}
        {showChat && (
          <aside className="w-72 bg-surface border-l border-border flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium text-foreground">Chat</span>
              <button
                onClick={() => setShowChat(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-muted text-xs text-center py-8">No messages yet</p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-0.5">
                    <p className="text-xs text-muted font-medium">{msg.senderName}</p>
                    <p className="text-sm text-foreground break-words">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border p-3 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Type a message…"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent transition-colors"
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim()}
                className="p-2 rounded-lg bg-accent hover:bg-accent-hover text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Bottom Controls ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-3 pb-6 pt-16 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ControlButton onClick={zoomOut} title="Zoom out">
          <ZoomOut className="w-5 h-5" />
        </ControlButton>
        <span className="text-white/60 text-xs w-10 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <ControlButton onClick={zoomIn} title="Zoom in">
          <ZoomIn className="w-5 h-5" />
        </ControlButton>

        <div className="w-px h-6 bg-white/20 mx-1" />

        <ControlButton onClick={toggleFreeze} title={isFrozen ? 'Resume' : 'Freeze frame'} active={isFrozen}>
          {isFrozen ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </ControlButton>

        <div className="w-px h-6 bg-white/20 mx-1" />

        <ControlButton onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </ControlButton>
      </div>

      {/* ── Reconnecting Overlay ── */}
      {isReconnecting && (
        <div className="absolute inset-0 z-40 bg-black/60 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <p className="text-white text-sm font-medium">
            {connectionState === 'connecting' ? 'Connecting to stream…' : 'Reconnecting…'}
          </p>
        </div>
      )}

      {/* ── Connection Failed Overlay ── */}
      {connectionState === 'failed' && (
        <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center gap-6 px-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-center">
            <h3 className="text-white text-lg font-semibold mb-2">Connection failed</h3>
            <p className="text-white/60 text-sm max-w-xs">
              Could not connect to the stream. The host may have ended the session.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Control Button Component ─────────────────────────────────────────────────

function ControlButton({
  onClick,
  title,
  children,
  active = false,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2.5 rounded-xl transition-all duration-150 ${
        active
          ? 'bg-accent text-white shadow-lg shadow-accent/30'
          : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-sm'
      }`}
    >
      {children}
    </button>
  );
}
