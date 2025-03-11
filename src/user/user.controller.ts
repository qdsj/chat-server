import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ClientProxy } from '@nestjs/microservices';
import { AddFriend } from './dto/add-friend.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt.auth';
import { AuthServerAuthGuard } from 'src/guards/authService.auth';
import { AgreeFriend } from './dto/agree-friend.dto';
import { BlockFriend } from './dto/block.friend.dto';

@UseGuards(JwtAuthGuard, AuthServerAuthGuard)
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
    const result = await this.userService.findUserByNameOrEmail(params);
    return { data: result };
  }
  @Get('/findUserByEmail')
  async findUserByEmail(@Query('email') email: string) {
    if (!email) return { data: null };
    const params = { email };
    const result = await this.userService.findUserByNameOrEmail(params);
    return { data: result };
  }

  @Post('/addFriend')
  addFriend(
    @Body() data: AddFriend,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    console.log(data, req.user);
    return this.userService.addFriend(req.user.id, data.friendId);
  }

  @Post('/agreeFriend')
  agreeFriend(
    @Body() data: AgreeFriend,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    console.log(data, req.user);
    return 'agree friend';
  }

  @Post('/blockFriend')
  blockFriend(
    @Body() data: BlockFriend,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    console.log(data, req.user);
    return 'blockFriend friend';
  }

  @Post('/unblockFriend')
  unblockFriend(
    @Body() data: BlockFriend,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    console.log(data, req.user);
    return 'unblockFriend friend';
  }
}
