import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Participant } from '../participants/participant.entity';

export enum RoomStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  hostId: string;

  @Column({ unique: true, length: 8 })
  inviteCode: string;

  @Column({ default: 10 })
  maxViewers: number;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ nullable: true, type: 'varchar' })
  password: string | null;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.ACTIVE,
  })
  status: RoomStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @OneToMany(() => Participant, (p) => p.room)
  participants: Participant[];
}
