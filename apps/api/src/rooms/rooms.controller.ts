import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';

interface AuthRequest {
  user: {
    id: string;
    displayName: string;
    email: string;
  };
}

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createRoom(@Request() req: AuthRequest, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(req.user.id, dto, req.user.displayName);
  }

  @Get('invite/:code')
  getRoomByCode(@Param('code') code: string) {
    return this.roomsService.getRoomByInviteCode(code);
  }

  @Get(':id')
  getRoom(@Param('id') id: string) {
    return this.roomsService.getRoomById(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  joinRoom(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.roomsService.joinRoom(id, req.user.id, req.user.displayName);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  leaveRoom(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.roomsService.leaveRoom(id, req.user.id);
  }

  @Patch(':id/lock')
  @UseGuards(JwtAuthGuard)
  lockRoom(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.roomsService.lockRoom(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteRoom(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.roomsService.deleteRoom(id, req.user.id);
  }

  @Delete(':id/participants/:participantId')
  @UseGuards(JwtAuthGuard)
  kickParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Request() req: AuthRequest,
  ) {
    return this.roomsService.kickParticipant(id, req.user.id, participantId);
  }

  @Get(':id/token')
  @UseGuards(JwtAuthGuard)
  async getHostLivekitToken(@Param('id') id: string, @Request() req: AuthRequest) {
    const token = await this.roomsService.getLivekitToken(id, req.user.id, req.user.displayName);
    return {
      token,
      livekitUrl: process.env.LIVEKIT_PUBLIC_URL || process.env.LIVEKIT_URL || 'ws://161.33.76.85:7880',
    };
  }

  @Post(':id/token')
  async getViewerLivekitToken(
    @Param('id') id: string,
    @Body() body: { participantName?: string },
  ) {
    const identity = body?.participantName || `viewer-${Math.random().toString(36).slice(2, 8)}`;
    const token = await this.roomsService.getLivekitToken(id, identity, identity);
    return {
      token,
      livekitUrl: process.env.LIVEKIT_PUBLIC_URL || process.env.LIVEKIT_URL || 'ws://161.33.76.85:7880',
    };
  }
}
