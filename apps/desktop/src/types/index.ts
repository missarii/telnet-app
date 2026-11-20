// ─── Core Domain Types ───────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  inviteCode: string; // "TEL-XXXXX" format
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
  userId: string;
  displayName: string;
  role: 'host' | 'viewer';
  joinedAt: string;
  isConnected: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
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
  bitrate: number; // Kbps
  packetLoss: number; // percentage 0-100
  quality: VideoQuality;
  isConnected: boolean;
}

// ─── Screen Capture Types ─────────────────────────────────────────────────────

export interface SourceInfo {
  id: string;
  name: string;
  thumbnail: string; // base64 data URL
  type: 'screen' | 'window';
}

export interface ShareSession {
  sourceId: string;
  sourceName: string;
  startedAt: string;
  roomId: string;
  stream: MediaStream | null;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface CreateRoomPayload {
  name: string;
  maxViewers: number;
  password?: string;
}

export interface JoinRoomPayload {
  inviteCode: string;
  password?: string;
}

export interface TokenResponse {
  token: string;
  livekitUrl: string;
}

// ─── Electron IPC Bridge ──────────────────────────────────────────────────────

export interface ElectronAPI {
  getSources: () => Promise<SourceInfo[]>;
  startCapture: (sourceId: string) => void;
  stopCapture: () => void;
  onShareStarted: (cb: (sourceId: string) => void) => () => void;
  onShareStopped: (cb: () => void) => () => void;
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
