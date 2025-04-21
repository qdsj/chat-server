import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { JwtAuthGuard } from 'src/guards/jwt.auth';
import { AuthServerAuthGuard } from 'src/guards/authService.auth';

@UseGuards(JwtAuthGuard, AuthServerAuthGuard)
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  // 获取session列表
  @Get()
  async getSessionList(@Req() req: Request & { user: { id: string } }) {
    try {
      const res = await this.sessionService.getSessionList({
        user: {
          id: req.user.id,
        },
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

  // 增加session
  @Post('add')
  async addSession(
    @Body() data: { roomId: string; type: 'person' | 'group' },
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      if (!data.roomId) throw new Error('roomId is required');
      if (!data.type) throw new Error('type is required');

      const res = await this.sessionService.addSession({
        room: {
          id: data.roomId,
          type: data.type,
        },
        user: {
          id: req.user.id,
        },
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
  // 删除session
  @Post('delete')
  async deleteSession(
    @Body() data: { roomId: string; type: 'person' | 'group' },
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      if (!data.roomId) throw new Error('roomId is required');
      if (!data.type) throw new Error('type is required');

      const res = await this.sessionService.deleteSession({
        room: {
          id: data.roomId,
          type: data.type,
        },
        user: {
          id: req.user.id,
        },
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
