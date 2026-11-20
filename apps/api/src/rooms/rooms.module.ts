import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './room.entity';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { LiveKitService } from './livekit.service';
import { ParticipantsModule } from '../participants/participants.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room]), ParticipantsModule],
  providers: [RoomsService, RoomsGateway, LiveKitService],
  controllers: [RoomsController],
  exports: [RoomsService, LiveKitService],
})
export class RoomsModule {}
