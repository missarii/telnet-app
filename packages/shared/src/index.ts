// ─── Core Domain Types ───────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  inviteCode: string;
  maxViewers: number;
  isLocked: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export interface Participant {
  id: string;
  roomId: string;
  userId: string;
  role: ParticipantRole;
  displayName: string;
  joinedAt: string;
}

export type ParticipantRole = 'host' | 'viewer';

// ─── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// ─── WebRTC / LiveKit Configuration ──────────────────────────────────────────

export interface WebRTCConfig {
  livekitUrl: string;
  livekitToken: string;
  roomName: string;
  /**
   * ICE servers for TURN/STUN fallback.
   */
  iceServers: RTCIceServer[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResult {
  access_token: string;
  user: Pick<User, 'id' | 'email'>;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export interface ParticipantJoinedEvent {
  participant: Participant;
  timestamp: string;
}

export interface ParticipantLeftEvent {
  userId: string;
  timestamp: string;
}

export interface ParticipantCountEvent {
  count: number;
}

export interface HostShareStartedEvent {
  hostId: string;
  timestamp: string;
}

export interface HostShareStoppedEvent {
  hostId: string;
  timestamp: string;
}

// ─── Screen Capture ───────────────────────────────────────────────────────────

export interface SourceInfo {
  id: string;
  name: string;
  thumbnail: string;
}
