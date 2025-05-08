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

  // http method
  // get post delete put
  @Get('/findUserByName')
  async findUserByName(@Query('username') username: string) {
    try {
      if (!username) return { data: null };
      const params = { username };
      const result = await this.userService.findUserByNameOrEmail(params);

      return {
        status: HttpStatus.OK,
        message: 'success',
        data: result,
      };
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
        data: null,
      };
    }
  }
  @Get('/findUserByEmail')
  async findUserByEmail(@Query('email') email: string) {
    try {
      if (!email) return { data: null };
      const params = { email };
      const result = await this.userService.findUserByNameOrEmail(params);
      return {
        status: HttpStatus.OK,
        message: 'success',
        data: result,
      };
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('/getFriendList')
  async getFriendList(
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    const userId = req.user.id;
    try {
      const data = await this.userService.getFriendList(userId);
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

  // 获取拉黑好友列表
  @Get('/getBlockList')
  async getBlockList(
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    const userId = req.user.id;
    try {
      const data = await this.userService.getBlockList(userId);
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

  @Post('/addFriend')
  async addFriend(
    @Body() data: AddFriend,
    @Req() req: Request & { user: { id: string; username: string } },
  ) {
    try {
      if (!data.friendId || !data.requestMessage) {
        throw new BadRequestException(
          'friendId and requestMessage are required',
        );
      }
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
      return {
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
        data: null,
      };
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
      const res = await this.userService.blockFriend({
        id: req.user.id,
        name: req.user.username,
        receiverId: data.friendId,
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
