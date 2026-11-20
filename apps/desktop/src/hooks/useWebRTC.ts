import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState as LKConnectionState,
  type LocalTrack,
  type RemoteTrack,
  type RemoteParticipant,
} from 'livekit-client';
import { createLiveKitRoom, connectToRoom } from '../services/livekit';
import type { ConnectionState, VideoQuality, Participant } from '../types';

// ─── Helper: map LK connection state → our type ───────────────────────────────
function mapConnectionState(lkState: LKConnectionState): ConnectionState {
  switch (lkState) {
    case LKConnectionState.Connected:
      return 'connected';
    case LKConnectionState.Connecting:
      return 'connecting';
    case LKConnectionState.Reconnecting:
      return 'reconnecting';
    case LKConnectionState.Disconnected:
      return 'disconnected';
    default:
      return 'disconnected';
  }
}

function qualityFromLatency(latencyMs: number): VideoQuality {
  if (latencyMs < 80) return 'excellent';
  if (latencyMs < 200) return 'good';
  return 'poor';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseWebRTCReturn {
  publish: (sourceId: string) => Promise<void>;
  unpublish: () => Promise<void>;
  remoteTrack: RemoteTrack | null;
  localTrack: LocalTrack | null;
  connectionState: ConnectionState;
  participants: Participant[];
  latency: number;
  bitrate: number;
  packetLoss: number;
  quality: VideoQuality;
  error: string | null;
}

export function useWebRTC(
  roomId: string,
  role: 'host' | 'viewer',
  participantName = 'Anonymous',
): UseWebRTCReturn {
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localTrack, setLocalTrack] = useState<LocalTrack | null>(null);
  const [remoteTrack, setRemoteTrack] = useState<RemoteTrack | null>(null);
  const [latency, setLatency] = useState(0);
  const [bitrate, setBitrate] = useState(0);
  const [packetLoss, setPacketLoss] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ── Build participant list from LK remote participants ─────────────────────
  const refreshParticipants = useCallback((room: Room) => {
    const list: Participant[] = [];

    // Local (host)
    const local = room.localParticipant;
    list.push({
      id: local.sid,
      roomId,
      userId: local.identity,
      displayName: local.name ?? local.identity,
      role: role === 'host' ? 'host' : 'viewer',
      joinedAt: new Date().toISOString(),
      isConnected: true,
    });

    // Remotes
    room.remoteParticipants.forEach((rp: RemoteParticipant) => {
      list.push({
        id: rp.sid,
        roomId,
        userId: rp.identity,
        displayName: rp.name ?? rp.identity,
        role: 'viewer',
        joinedAt: new Date().toISOString(),
        isConnected: rp.connectionQuality !== undefined,
      });
    });

    setParticipants(list);
  }, [roomId, role]);

  // ── Connect on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const room = createLiveKitRoom();
    roomRef.current = room;

    // State changes
    room.on(RoomEvent.ConnectionStateChanged, (state: LKConnectionState) => {
      setConnectionState(mapConnectionState(state));
    });

    // Participant changes
    room.on(RoomEvent.ParticipantConnected, () => refreshParticipants(room));
    room.on(RoomEvent.ParticipantDisconnected, () => refreshParticipants(room));

    // Remote track subscriptions (viewer)
    room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Video) {
          setRemoteTrack(track);
        }
      },
    );
    room.on(
      RoomEvent.TrackUnsubscribed,
      (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Video) {
          setRemoteTrack(null);
        }
      },
    );

    // Connect
    setConnectionState('connecting');
    connectToRoom(room, roomId, participantName)
      .then(() => {
        refreshParticipants(room);
      })
      .catch((err: unknown) => {
        const msg = (err as { message?: string })?.message ?? 'Connection failed';
        setError(msg);
        setConnectionState('failed');
      });

    // Stats polling
    const statsInterval = setInterval(async () => {
      if (!room.localParticipant) return;
      try {
        // Basic latency approximation via RTT if available
        const stats = await room.localParticipant.getTrackPublication(
          Track.Source.ScreenShare,
        )?.track?.getRTCStatsReport();
        if (stats) {
          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && report.currentRoundTripTime) {
              setLatency(Math.round(report.currentRoundTripTime * 1000));
            }
            if (report.type === 'outbound-rtp' || report.type === 'inbound-rtp') {
              const kbps = Math.round(
                ((report as RTCOutboundRtpStreamStats).bytesSent ?? 0) / 125,
              );
              if (kbps > 0) setBitrate(kbps);
              const lossRate =
                ((report as RTCInboundRtpStreamStats).packetsLost ?? 0) /
                Math.max(
                  1,
                  ((report as RTCInboundRtpStreamStats).packetsReceived ?? 1),
                );
              setPacketLoss(Math.round(lossRate * 100));
            }
          });
        }
      } catch {
        // Stats not critical
      }
    }, 2000);

    return () => {
      clearInterval(statsInterval);
      room.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, participantName]);

  // ── Host: publish screen track ─────────────────────────────────────────────
  const publish = useCallback(async (sourceId: string) => {
    const room = roomRef.current;
    if (!room) return;

    try {
      // Get screen stream via Electron IPC
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false, // NEVER audio
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
          },
        } as MediaTrackConstraints,
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) throw new Error('No video track');

      const { LocalVideoTrack } = await import('livekit-client');
      const lkTrack = new LocalVideoTrack(videoTrack, undefined, false);

      await room.localParticipant.publishTrack(lkTrack, {
        source: Track.Source.ScreenShare,
        simulcast: false,
      });

      setLocalTrack(lkTrack);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Failed to start screen share';
      setError(msg);
      throw err;
    }
  }, []);

  // ── Host: unpublish ────────────────────────────────────────────────────────
  const unpublish = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !localTrack) return;

    try {
      await room.localParticipant.unpublishTrack(localTrack as LocalTrack & import('livekit-client').LocalVideoTrack);
      localTrack.stop();
      setLocalTrack(null);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Failed to stop sharing';
      setError(msg);
    }
  }, [localTrack]);

  const quality = qualityFromLatency(latency);

  return {
    publish,
    unpublish,
    remoteTrack,
    localTrack,
    connectionState,
    participants,
    latency,
    bitrate,
    packetLoss,
    quality,
    error,
  };
}
