import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './guards/jwt.auth';
import { AuthServerAuthGuard } from './guards/authService.auth';
import { UserInfoDto } from './user/dto/user.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return 'I am chat server';
  }

  @UseGuards(JwtAuthGuard, AuthServerAuthGuard)
  @Get('/getUserInfo')
  async getUserInfo(
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      const data = await this.appService.getUserInfo(req.user.id);
      return {
        status: HttpStatus.OK,
        message: 'success',
        data,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, AuthServerAuthGuard)
  @Post('/updateUserInfo')
  async updateUserInfo(
    @Body() data: UserInfoDto,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      const _data = await this.appService.updateUserInfo(req.user.id, data);
      return {
        status: HttpStatus.OK,
        message: 'success',
        data: _data,
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
