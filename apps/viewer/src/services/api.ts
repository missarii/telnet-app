import axios from 'axios';
import type { Room, TokenResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const client = axios.create({ baseURL: BASE_URL });

/**
 * Look up a room by its invite code (e.g. "TEL-ABCD1234").
 */
export async function getRoomByInviteCode(inviteCode: string): Promise<Room> {
  const { data } = await client.get<Room>(`/rooms/invite/${inviteCode}`);
  return data;
}

/**
 * Request a LiveKit viewer token for the given room.
 * The participantName is a randomly generated anonymous identifier.
 */
export async function getLivekitToken(
  roomId: string,
  participantName: string,
): Promise<TokenResponse> {
  const { data } = await client.post<TokenResponse>(`/rooms/${roomId}/token`, {
    participantName,
    role: 'viewer',
  });
  return data;
}
