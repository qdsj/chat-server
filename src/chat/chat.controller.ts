import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthServerAuthGuard } from 'src/guards/authService.auth';
import { JwtAuthGuard } from 'src/guards/jwt.auth';
import { ChatService } from './chat.service';
import { ChatHistoryPayload, ChatRoomInfo } from './dto/chat.dto';

@UseGuards(JwtAuthGuard, AuthServerAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  findAll() {
    return { data: 'chat server-chat findAll' };
  }

  // 获取单聊聊天记录
  @Post('/getChatHistory')
  async getChatHistory(
    @Body() data: ChatHistoryPayload,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    const user = req.user;
    if (!data.roomId) throw new Error('roomId is required');

    try {
      const res = await this.chatService.getSingleChatHistory(
        user,
        data.roomId,
      );
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

  @Post('/createGroupChat')
  createGroupChat(
    @Body() data: { userId: string[] },
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      const user = req.user;
      if (!data.userId) throw new Error('userId is required');

      const res = this.chatService.createGroupByAddMembers({
        userId: user.id,
        memberIds: data.userId,
      });

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

  // 修改群信息
  @Post('/updateGroupInfo')
  updateGroupInfo(
    @Body()
    data: { roomId: string[] } & ChatRoomInfo,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      const user = req.user;
      if (!data.roomId) throw new Error('roomId is required');

      const res = this.chatService.updateGroupInfo({
        ...data,
        userId: user.id,
      });

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

  // 获取群消息
  @Post('/getGroupChatHistory')
  async getGroupChatHistory(
    @Body() data: ChatHistoryPayload,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    if (!data.roomId) throw new Error('roomId is required');

    try {
      const res = await this.chatService.getGroupChatHistory({
        roomId: data.roomId,
        userId: req.user.id,
      });
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

  // 打开聊天窗口
  @Post('/openChatWindow')
  openChatWindow(
    @Body() data: { roomId: string; type: 'person' | 'group' },
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      const user = req.user;
      if (!data.roomId) throw new Error('roomId is required');
      return this.chatService.openChatWindow({
        user,
        roomId: data.roomId,
        type: data.type,
      });
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
        data: null,
      };
    }
  }
}
