// ─── Core Domain Types ───────────────────────────────────────────────────────

export interface Room {
  id: string;
  name: string;
  hostId: string;
  inviteCode: string;
  maxViewers: number;
  viewerCount: number;
  isLocked: boolean;
  hasPassword: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface Participant {
  id: string;
  roomId: string;
  userId?: string;
  displayName: string;
  role: 'host' | 'viewer';
  joinedAt: string;
  isConnected: boolean;
}

export interface ChatMessage {
  id: string;
  roomId?: string;
  senderId?: string;
  senderName: string;
  text: string;
  sentAt: string;
}

// ─── WebRTC / Connection Types ────────────────────────────────────────────────

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

export type VideoQuality = 'excellent' | 'good' | 'poor' | 'unknown';

export interface ConnectionStats {
  latencyMs: number;
  bitrate: number;
  packetLoss: number;
  quality: VideoQuality;
  isConnected: boolean;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface TokenResponse {
  token: string;
  livekitUrl: string;
}
