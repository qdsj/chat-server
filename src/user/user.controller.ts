import { Controller, Get, Inject, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { ClientProxy } from '@nestjs/microservices';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
  ) {}

  @Get('/findUserByName')
  async findUserByName(@Query('username') username: string) {
    if (!username) return { data: null };
    const params = { username };
    const result = await this.authService
      .send('findUserByNameOrEmail', params)
      .toPromise();
    return { data: result };
  }
  @Get('/findUserByEmail')
  async findUserByEmail(@Query('email') email: string) {
    if (!email) return { data: null };
    const params = { email };
    const result = await this.authService
      .send('findUserByNameOrEmail', params)
      .toPromise();
    return { data: result };
  }
}
