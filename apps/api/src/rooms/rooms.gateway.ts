import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';
import { ParticipantsService } from '../participants/participants.service';
import { ParticipantRole } from '../participants/participant.entity';

interface JoinRoomPayload {
  roomId: string;
  userId: string;
  displayName: string;
  role: ParticipantRole;
}

interface LeaveRoomPayload {
  roomId: string;
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'app://localhost'],
    credentials: true,
  },
  namespace: '/rooms',
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly roomsService: RoomsService,
    private readonly participantsService: ParticipantsService,
  ) {}

  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomId, userId, displayName, role } = payload;

    await client.join(roomId);

    const participant = await this.participantsService.addParticipant(
      roomId,
      userId,
      role,
      displayName,
    );

    this.server.to(roomId).emit('participant-joined', {
      participant,
      timestamp: new Date().toISOString(),
    });

    const count = await this.participantsService.getParticipantCount(roomId);
    this.server.to(roomId).emit('participant-count', { count });
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @MessageBody() payload: LeaveRoomPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomId, userId } = payload;

    await this.participantsService.removeParticipant(roomId, userId);
    await client.leave(roomId);

    this.server.to(roomId).emit('participant-left', {
      userId,
      timestamp: new Date().toISOString(),
    });

    const count = await this.participantsService.getParticipantCount(roomId);
    this.server.to(roomId).emit('participant-count', { count });
  }

  @SubscribeMessage('share-started')
  handleShareStarted(
    @MessageBody() payload: { roomId: string; hostId: string },
  ): void {
    this.server.to(payload.roomId).emit('host-share-started', {
      hostId: payload.hostId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('share-stopped')
  handleShareStopped(
    @MessageBody() payload: { roomId: string; hostId: string },
  ): void {
    this.server.to(payload.roomId).emit('host-share-stopped', {
      hostId: payload.hostId,
      timestamp: new Date().toISOString(),
    });
  }
}
