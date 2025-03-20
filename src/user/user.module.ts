import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from 'src/chat-socket/entities/chat-room-entity';
import { Friends } from './entities/friends.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRoomShip } from 'src/chat-socket/entities/user-room-ship.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Friends, ChatRoom, UserRoomShip])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
