import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccessToken,
  VideoGrant,
  RoomServiceClient,
  TrackSource,
} from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private readonly roomService: RoomServiceClient;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly host: string;

  constructor(private readonly configService: ConfigService) {
    this.host = (
      this.configService.get<string>('LIVEKIT_HOST') ??
      this.configService.get<string>('LIVEKIT_URL') ??
      'ws://localhost:7880'
    ) as string;
    this.apiKey = this.configService.get<string>('LIVEKIT_API_KEY') as string;
    this.apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET') as string;

    this.roomService = new RoomServiceClient(this.host, this.apiKey, this.apiSecret);
  }

  async generateToken(
    roomName: string,
    participantIdentity: string,
    canPublish: boolean,
  ): Promise<string> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      ttl: 3600,
    });

    const publishSources: TrackSource[] = canPublish
      ? [TrackSource.SCREEN_SHARE, TrackSource.CAMERA]
      : [];

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish,
      canSubscribe: true,
      canPublishData: true,
      canPublishSources: publishSources,
    };

    at.addGrant(grant);
    // toJwt() returns Promise<string> in livekit-server-sdk v2+
    return at.toJwt();
  }

  async createRoom(name: string) {
    return this.roomService.createRoom({ name });
  }

  async listParticipants(roomName: string) {
    return this.roomService.listParticipants(roomName);
  }

  async removeParticipant(roomName: string, identity: string) {
    return this.roomService.removeParticipant(roomName, identity);
  }
}

