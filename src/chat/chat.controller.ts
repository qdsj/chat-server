import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthServerAuthGuard } from 'src/guards/authService.auth';
import { JwtAuthGuard } from 'src/guards/jwt.auth';
import { ChatService } from './chat.service';
import { Request } from 'express';
import { ChatHistoryPayload } from './dto/chat.dto';

@UseGuards(JwtAuthGuard, AuthServerAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  findAll() {
    return { data: 'chat server-chat findAll' };
  }

  @Get('/getChatHistory')
  getChatHistory(
    @Body() data: ChatHistoryPayload,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    const user = req.user;
    if (!data.roomId) throw new Error('roomId is required');

    try {
      const res = this.chatService.getSingleChatHistory(user, data.roomId);
      return {
        status: HttpStatus.OK,
        message: 'success',
        data: res,
      };
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
        data: null,
      };
    }
  }
}
