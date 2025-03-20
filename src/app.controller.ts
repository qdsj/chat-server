import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './guards/jwt.auth';
import { AuthServerAuthGuard } from './guards/authService.auth';

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
}
