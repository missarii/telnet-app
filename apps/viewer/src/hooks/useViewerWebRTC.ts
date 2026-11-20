import { useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  Track,
  ConnectionState as LKConnectionState,
  VideoTrack,
} from 'livekit-client';
import type { ConnectionState, VideoQuality } from '../types';

export interface ViewerParticipant {
  identity: string;
  name: string;
}

interface UseViewerWebRTCResult {
  videoTrack: VideoTrack | null;
  connectionState: ConnectionState;
  participants: ViewerParticipant[];
  latency: number;
  quality: VideoQuality;
}

function mapLKState(state: LKConnectionState): ConnectionState {
  switch (state) {
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

export function useViewerWebRTC(
  livekitUrl: string,
  token: string,
  enabled: boolean,
): UseViewerWebRTCResult {
  const roomRef = useRef<Room | null>(null);
  const [videoTrack, setVideoTrack] = useState<VideoTrack | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [participants, setParticipants] = useState<ViewerParticipant[]>([]);
  const [latency, setLatency] = useState(0);
  const [quality, setQuality] = useState<VideoQuality>('unknown');

  useEffect(() => {
    if (!enabled || !livekitUrl || !token) return;

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    // ── Helpers ──────────────────────────────────────────────────────────────

    function refreshParticipants() {
      const list: ViewerParticipant[] = Array.from(room.remoteParticipants.values()).map((p) => ({
        identity: p.identity,
        name: p.name ?? p.identity,
      }));
      setParticipants(list);
    }

    function tryAttachTrack(
      track: RemoteTrack,
      _publication: RemoteTrackPublication,
      _participant: RemoteParticipant,
    ) {
      if (track.kind === Track.Kind.Video) {
        setVideoTrack(track as VideoTrack);
      }
    }

    function handleTrackUnsubscribed(
      track: RemoteTrack,
      _publication: RemoteTrackPublication,
      _participant: RemoteParticipant,
    ) {
      if (track.kind === Track.Kind.Video) {
        setVideoTrack(null);
      }
    }

    // ── Event wiring ─────────────────────────────────────────────────────────

    room
      .on(RoomEvent.ConnectionStateChanged, (state: LKConnectionState) => {
        setConnectionState(mapLKState(state));
        if (state === LKConnectionState.Connected) {
          // Check if the host is already publishing
          room.remoteParticipants.forEach((participant) => {
            participant.trackPublications.forEach((pub) => {
              if (pub.track && pub.kind === Track.Kind.Video) {
                setVideoTrack(pub.track as VideoTrack);
              }
            });
          });
        }
      })
      .on(RoomEvent.TrackSubscribed, tryAttachTrack)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.ParticipantConnected, refreshParticipants)
      .on(RoomEvent.ParticipantDisconnected, refreshParticipants);

    // ── Stats polling ─────────────────────────────────────────────────────────

    const statsInterval = setInterval(async () => {
      if (room.state !== LKConnectionState.Connected) return;
      try {
        // Approximate RTT via signal latency if available
        const rtt = (room as unknown as { engine?: { latency?: number } }).engine?.latency;
        if (typeof rtt === 'number') {
          setLatency(Math.round(rtt));
          if (rtt < 80) setQuality('excellent');
          else if (rtt < 200) setQuality('good');
          else setQuality('poor');
        }
      } catch {
        // ignore
      }
    }, 3000);

    // ── Connect ───────────────────────────────────────────────────────────────

    setConnectionState('connecting');
    room.connect(livekitUrl, token).catch((err) => {
      console.error('[useViewerWebRTC] connect error', err);
      setConnectionState('failed');
    });

    return () => {
      clearInterval(statsInterval);
      room.disconnect();
      roomRef.current = null;
      setVideoTrack(null);
      setConnectionState('disconnected');
      setParticipants([]);
    };
  }, [livekitUrl, token, enabled]);

  return { videoTrack, connectionState, participants, latency, quality };
}
