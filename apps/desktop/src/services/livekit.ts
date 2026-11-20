import {
  Room,
  RoomEvent,
  Track,
  LocalTrack,
  RemoteTrack,
  RemoteParticipant,
  LocalParticipant,
  ConnectionState,
  type RoomOptions,
  type ConnectOptions,
} from 'livekit-client';
import { getLivekitToken } from './api';

// Re-export LiveKit types for use across the app
export {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  type LocalTrack,
  type RemoteTrack,
  type RemoteParticipant,
  type LocalParticipant,
};

// ─── Room Factory ─────────────────────────────────────────────────────────────

export interface LiveKitRoomConfig {
  roomId: string;
  participantName: string;
  options?: RoomOptions;
}

/**
 * Creates an initialised LiveKit Room instance.
 * Does NOT connect — call room.connect() separately.
 */
export function createLiveKitRoom(options?: RoomOptions): Room {
  return new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: { width: 1920, height: 1080, frameRate: 30 },
    },
    ...options,
  });
}

// ─── Token Fetching ───────────────────────────────────────────────────────────

/**
 * Fetches a participant token from our backend and returns
 * { token, livekitUrl } ready to pass to room.connect().
 */
export async function getToken(
  roomId: string,
  participantName: string,
): Promise<{ token: string; livekitUrl: string }> {
  return getLivekitToken(roomId, participantName);
}

// ─── Connect Helper ───────────────────────────────────────────────────────────

export async function connectToRoom(
  room: Room,
  roomId: string,
  participantName: string,
  connectOptions?: ConnectOptions,
): Promise<void> {
  const { token, livekitUrl } = await getToken(roomId, participantName);
  await room.connect(livekitUrl, token, connectOptions);
}
