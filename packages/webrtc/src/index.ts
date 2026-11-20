import {
  Room,
  RoomEvent,
  LocalVideoTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Track,
  VideoPresets,
  RoomConnectOptions,
  ConnectionState,
} from 'livekit-client';

export type { Room, LocalVideoTrack };

/**
 * Connects to a LiveKit room.
 * Returns the connected Room instance.
 */
export async function connectToRoom(
  url: string,
  token: string,
  roomName: string,
): Promise<Room> {
  const room = new Room({
    // Optimize for screen sharing — disable adaptive stream scaling
    adaptiveStream: false,
    dynacast: false,
    videoCaptureDefaults: {
      resolution: VideoPresets.h1080.resolution,
    },
  });

  const connectOptions: RoomConnectOptions = {
    autoSubscribe: true,
  };

  room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
    console.log(`[LiveKit] Room "${roomName}" connection state: ${state}`);
  });

  room.on(
    RoomEvent.TrackSubscribed,
    (
      track: RemoteTrack,
      _publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      console.log(`[LiveKit] Track subscribed from ${participant.identity}: ${track.kind}`);
    },
  );

  room.on(RoomEvent.Disconnected, () => {
    console.log(`[LiveKit] Disconnected from room "${roomName}"`);
  });

  await room.connect(url, token, connectOptions);
  console.log(`[LiveKit] Connected to room "${roomName}" as ${room.localParticipant.identity}`);

  return room;
}

/**
 * Publishes a screen share video track to the room.
 * Audio is intentionally NOT published (screen-only sharing).
 */
export async function publishScreen(
  room: Room,
  videoTrack: LocalVideoTrack,
): Promise<void> {
  if (room.state !== ConnectionState.Connected) {
    throw new Error('Room is not connected');
  }

  await room.localParticipant.publishTrack(videoTrack, {
    source: Track.Source.ScreenShare,
    // Explicitly publish only video — no audio
    simulcast: false,
  });

  console.log('[LiveKit] Screen video track published (audio intentionally suppressed)');
}

/**
 * Disconnects from the LiveKit room and cleans up local tracks.
 */
export async function disconnectFromRoom(room: Room): Promise<void> {
  // Unpublish all local tracks before disconnecting
  const publications = [...room.localParticipant.trackPublications.values()];
  for (const publication of publications) {
    if (publication.track) {
      await room.localParticipant.unpublishTrack(publication.track);
      publication.track.stop();
    }
  }

  await room.disconnect();
  console.log('[LiveKit] Disconnected and cleaned up');
}

/**
 * Creates a LocalVideoTrack from a screen-share MediaStreamTrack.
 * Use this with desktopCapturer output in Electron.
 */
export function createScreenVideoTrack(mediaStreamTrack: MediaStreamTrack): LocalVideoTrack {
  return new LocalVideoTrack(mediaStreamTrack);
}
