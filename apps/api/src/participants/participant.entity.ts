import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Room } from '../rooms/room.entity';
import { User } from '../auth/user.entity';

export enum ParticipantRole {
  HOST = 'host',
  VIEWER = 'viewer',
}

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomId: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.VIEWER,
  })
  role: ParticipantRole;

  @Column()
  displayName: string;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
