import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
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
  async addFriend(
    @Body() data: AddFriend,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    console.log(data, req.user);
    if (!data.friendId || !data.requestMessage) {
      throw new BadRequestException('friendId and requestMessage are required');
    }

    try {
      const res = await this.userService.addFriend(
        req.user.id,
        data.friendId,
        data.requestMessage,
      );
      return {
        status: HttpStatus.OK,
        message: 'success',
        data: res,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/getRequestList')
  async getRequestList(
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    const userId = req.user.id;
    try {
      const data = await this.userService.getRequestList(userId);
      return {
        status: HttpStatus.OK,
        message: 'success',
        data,
      };
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
        data: null,
      };
    }
  }

  @Post('/agreeFriend')
  async agreeFriend(
    @Body() data: AgreeFriend,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    console.log(data, req.user);
    try {
      const res = await this.userService.agreeFriend(
        req.user.id,
        data.friendId,
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

  @Post('/blockFriend')
  async blockFriend(
    @Body() data: BlockFriend,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    console.log(data, req.user);
    try {
      const res = await this.userService.blockFriend(
        req.user.id,
        data.friendId,
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

  @Post('/unblockFriend')
  async unblockFriend(
    @Body() data: BlockFriend,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    console.log(data, req.user);
    try {
      const res = await this.userService.unblockFriend(
        req.user.id,
        data.friendId,
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
}
