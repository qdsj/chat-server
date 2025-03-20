import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthServerAuthGuard } from 'src/guards/authService.auth';
import { JwtAuthGuard } from 'src/guards/jwt.auth';
import { ChatService } from './chat.service';

@UseGuards(JwtAuthGuard, AuthServerAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  findAll() {
    return { data: 'chat server-chat findAll' };
  }
}
