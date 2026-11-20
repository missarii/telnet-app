import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant, ParticipantRole } from './participant.entity';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
  ) {}

  async addParticipant(
    roomId: string,
    userId: string,
    role: ParticipantRole,
    displayName: string,
  ): Promise<Participant> {
    const participant = this.participantRepository.create({
      roomId,
      userId,
      role,
      displayName,
    });
    return this.participantRepository.save(participant);
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    await this.participantRepository.delete({ roomId, userId });
  }

  async getParticipants(roomId: string): Promise<Participant[]> {
    return this.participantRepository.find({ where: { roomId } });
  }

  async isHost(roomId: string, userId: string): Promise<boolean> {
    const participant = await this.participantRepository.findOne({
      where: { roomId, userId, role: ParticipantRole.HOST },
    });
    return !!participant;
  }

  async getParticipantCount(roomId: string): Promise<number> {
    return this.participantRepository.count({ where: { roomId } });
  }
}
