import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type {
  Room,
  Participant,
  CreateRoomPayload,
  TokenResponse,
  ApiError,
} from '../types';

// ─── Client Setup ─────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT from localStorage on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('telnet_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const apiError: ApiError = {
      statusCode: err.response?.status ?? 0,
      message: err.response?.data?.message ?? err.message ?? 'Unknown error',
      error: err.response?.data?.error,
    };
    return Promise.reject(apiError);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register(
  email: string,
  password: string,
  displayName: string,
): Promise<{ token: string }> {
  const { data } = await client.post<{ token: string }>('/api/auth/register', {
    email,
    password,
    displayName,
  });
  return data;
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string }> {
  const { data } = await client.post<{ token: string }>('/api/auth/login', {
    email,
    password,
  });
  return data;
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
  const { data } = await client.post<Room>('/api/rooms', payload);
  return data;
}

export async function getRoomByInviteCode(inviteCode: string): Promise<Room> {
  const { data } = await client.get<Room>(`/api/rooms/invite/${inviteCode}`);
  return data;
}

export async function getRoomById(roomId: string): Promise<Room> {
  const { data } = await client.get<Room>(`/api/rooms/${roomId}`);
  return data;
}

export async function leaveRoom(roomId: string): Promise<void> {
  await client.delete(`/api/rooms/${roomId}/leave`);
}

export async function deleteRoom(roomId: string): Promise<void> {
  await client.delete(`/api/rooms/${roomId}`);
}

// ─── Participants ─────────────────────────────────────────────────────────────

export async function getParticipants(roomId: string): Promise<Participant[]> {
  const { data } = await client.get<Participant[]>(
    `/api/rooms/${roomId}/participants`,
  );
  return data;
}

export async function kickParticipant(
  roomId: string,
  participantId: string,
): Promise<void> {
  await client.delete(`/api/rooms/${roomId}/participants/${participantId}`);
}

// ─── LiveKit Token ────────────────────────────────────────────────────────────

export async function getLivekitToken(
  roomId: string,
  participantName: string,
): Promise<TokenResponse> {
  const { data } = await client.get<TokenResponse>(
    `/api/rooms/${roomId}/token`,
    { params: { participantName } } as AxiosRequestConfig,
  );
  return data;
}

export default client;
