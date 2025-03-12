import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
  getUserInfo(
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    return this.appService.getUserInfo(req.user.id);
  }
}
