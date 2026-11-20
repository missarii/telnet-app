import { useState, useCallback } from 'react';
import * as api from '../services/api';
import type { Room, Participant } from '../types';

/**
 * useRoom — provides room lifecycle helpers backed by the REST API.
 */
export function useRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ── Create ──────────────────────────────────────────────────────────────────
  const createRoom = useCallback(
    async (name: string, maxViewers: number, password?: string): Promise<Room> => {
      setLoading(true);
      setError(null);
      try {
        const room = await api.createRoom({ name, maxViewers, password });
        return room;
      } catch (err: unknown) {
        const msg =
          (err as { message?: string })?.message ?? 'Failed to create room';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ── Join ────────────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async (inviteCode: string): Promise<Room> => {
    setLoading(true);
    setError(null);
    try {
      const room = await api.getRoomByInviteCode(inviteCode);
      return room;
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      let msg = 'Failed to join room';
      if (apiErr.statusCode === 404) msg = 'Room not found. Check your invite code.';
      else if (apiErr.statusCode === 403) msg = 'Room is locked or password protected.';
      else if (apiErr.statusCode === 409) msg = 'Room is full.';
      else if (apiErr.message) msg = apiErr.message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Leave ───────────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(async (roomId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await api.leaveRoom(roomId);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Failed to leave room';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Kick ────────────────────────────────────────────────────────────────────
  const kickParticipant = useCallback(
    async (roomId: string, participantId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await api.kickParticipant(roomId, participantId);
      } catch (err: unknown) {
        const msg =
          (err as { message?: string })?.message ?? 'Failed to kick participant';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ── Get participants ────────────────────────────────────────────────────────
  const getParticipants = useCallback(
    async (roomId: string): Promise<Participant[]> => {
      try {
        return await api.getParticipants(roomId);
      } catch {
        return [];
      }
    },
    [],
  );

  return {
    loading,
    error,
    clearError,
    createRoom,
    joinRoom,
    leaveRoom,
    kickParticipant,
    getParticipants,
  };
}
