import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Room, RoomStatus } from './room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { ParticipantsService } from '../participants/participants.service';
import { ParticipantRole } from '../participants/participant.entity';
import { LiveKitService } from './livekit.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly participantsService: ParticipantsService,
    private readonly liveKitService: LiveKitService,
  ) {}

  private generateInviteCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  async createRoom(hostId: string, dto: CreateRoomDto, displayName: string): Promise<Room> {
    const inviteCode = this.generateInviteCode();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // +8h

    let hashedPassword: string | null = null;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    const room = this.roomRepository.create({
      name: dto.name,
      hostId,
      inviteCode,
      maxViewers: dto.maxViewers ?? 10,
      password: hashedPassword,
      expiresAt,
    });

    const saved = await this.roomRepository.save(room);

    // Add host as participant
    await this.participantsService.addParticipant(
      saved.id,
      hostId,
      ParticipantRole.HOST,
      displayName,
    );

    // Create LiveKit room (non-fatal)
    await this.liveKitService.createRoom(saved.id).catch(() => {});

    return this.getRoomById(saved.id);
  }

  async getRoomById(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: { participants: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async getRoomByInviteCode(code: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { inviteCode: code.toUpperCase() },
      relations: { participants: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async joinRoom(roomId: string, userId: string, displayName: string): Promise<Room> {
    const room = await this.getRoomById(roomId);

    if (room.status === RoomStatus.ENDED) {
      throw new BadRequestException('Room has ended');
    }
    if (room.isLocked) {
      throw new ForbiddenException('Room is locked');
    }

    const count = await this.participantsService.getParticipantCount(roomId);
    if (count >= room.maxViewers) {
      throw new BadRequestException('Room is full');
    }

    const participants = await this.participantsService.getParticipants(roomId);
    const existing = participants.find((p) => p.userId === userId);
    if (!existing) {
      await this.participantsService.addParticipant(
        roomId,
        userId,
        ParticipantRole.VIEWER,
        displayName,
      );
    }

    return this.getRoomById(roomId);
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await this.participantsService.removeParticipant(roomId, userId);
  }

  async lockRoom(roomId: string, hostId: string): Promise<Room> {
    const room = await this.getRoomById(roomId);
    if (room.hostId !== hostId) {
      throw new ForbiddenException('Only the host can lock/unlock the room');
    }
    room.isLocked = !room.isLocked;
    return this.roomRepository.save(room);
  }

  async deleteRoom(roomId: string, hostId: string): Promise<void> {
    const room = await this.getRoomById(roomId);
    if (room.hostId !== hostId) {
      throw new ForbiddenException('Only the host can end the room');
    }
    room.status = RoomStatus.ENDED;
    await this.roomRepository.save(room);
  }

  async kickParticipant(
    roomId: string,
    hostId: string,
    targetUserId: string,
  ): Promise<void> {
    const room = await this.getRoomById(roomId);
    if (room.hostId !== hostId) {
      throw new ForbiddenException('Only the host can kick participants');
    }
    await this.participantsService.removeParticipant(roomId, targetUserId);
    await this.liveKitService.removeParticipant(roomId, targetUserId).catch(() => {});
  }

  async getLivekitToken(
    roomId: string,
    userId: string,
    displayName: string,
  ): Promise<string> {
    const room = await this.getRoomById(roomId);
    const isHost = room.hostId === userId;
    return this.liveKitService.generateToken(roomId, userId, isHost);
  }

  async cleanupExpiredRooms(): Promise<void> {
    await this.roomRepository.update(
      { status: RoomStatus.ACTIVE, expiresAt: LessThan(new Date()) },
      { status: RoomStatus.ENDED },
    );
  }
}
