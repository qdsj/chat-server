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
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: 'chat server-chat findAll',
    };
  }

  // 获取单聊聊天记录
  @Post('/getSingleChatHistory')
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
  async createGroupChat(
    @Body() data: { userId: string[] },
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      const user = req.user;
      if (!data.userId) throw new Error('userId is required');

      const res = await this.chatService.createGroupByAddMembers({
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
  async updateGroupInfo(
    @Body()
    data: { roomId: string[] } & ChatRoomInfo,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      const user = req.user;
      if (!data.roomId) throw new Error('roomId is required');

      const res = await this.chatService.updateGroupInfo({
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

  // 查看聊天窗口
  @Post('/checkChatWindow')
  async openChatWindow(
    @Body() data: { roomId: string; type: 'person' | 'group' },
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      const user = req.user;
      if (!data.roomId) throw new Error('roomId is required');
      if (!data.type) throw new Error('type is required');
      const res = await this.chatService.openChatWindow({
        user,
        roomId: data.roomId,
        type: data.type,
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

  // 批量获取聊天窗口的时间
  @Post('/getChatWindowsTime')
  async getChatWindowTimes(
    @Body() data: { type: 'person' | 'group'; roomId: string }[],
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      if (
        !data ||
        !Array.isArray(data) ||
        !data.length ||
        !data[0].roomId ||
        !data[0].type
      )
        throw new Error('data is not valid');
      const res = await this.chatService.getChatWindowListByRoomId({
        user: req.user,
        rooms: data,
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

  // 获取群列表
  @Post('/getGroupList')
  async getGroupList(
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      const res = await this.chatService.getGroupList(req.user.id);
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

  // 修改群聊信息
  @Post('/updateGroupChatInfo')
  async updateGroupChatInfo(
    @Body() data: ChatRoomInfo & { roomId: string; type: 'person' | 'group' },
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      const user = req.user;
      if (!data.roomId) throw new Error('roomId is required');
      if (!data.type) throw new Error('type is required');
      if (data?.type !== 'group') throw new Error('type must be group');
      await this.chatService.updateGroupInfo({
        userId: user.id,
        ...data,
      });

      return {
        status: HttpStatus.OK,
        message: 'success',
        data: true,
      };
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
        data: null,
      };
    }
  }

  // 获取群成员的数量
  @Post('/getGroupMemberCount')
  async getGroupMemberCount(
    @Body() data: { roomId: string; type: 'person' | 'group' },
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      if (!data.roomId) throw new Error('roomId is required');
      if (!data.type) throw new Error('type is required');
      if (data?.type !== 'group') throw new Error('type must be group');

      const res = await this.chatService.getGroupMembersCount({
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
  // 获取群成员的信息
  @Post('/getGroupMemberInfo')
  async getGroupMemberInfo(
    @Body() data: { roomId: string; type: 'person' | 'group' },
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      if (!data.roomId) throw new Error('roomId is required');
      if (!data.type) throw new Error('type is required');
      if (data?.type !== 'group') throw new Error('type must be group');

      const res = await this.chatService.getGroupMembersInfo({
        roomId: data.roomId,
        userId: req.user.id,
      });

      console.log('res', res);
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

  // 添加群成员
  @Post('/addGroupMember')
  async addGroupMember(
    @Body()
    data: { roomId: string; type: 'person' | 'group'; userId: string },
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      if (!data.roomId) throw new Error('roomId is required');
      if (!data.type) throw new Error('type is required');
      if (data?.type !== 'group') throw new Error('type must be group');
      const res = await this.chatService.addGroupMember({
        user: req.user,
        ...data,
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
}
