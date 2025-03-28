import { Module } from '@nestjs/common';
import { AuthServerAuthGuard } from 'src/guards/authService.auth';
import { JwtAuthGuard } from 'src/guards/jwt.auth';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from 'src/chat/entities/chat-room-entity';
import { UserRoomShip } from 'src/chat/entities/user-room-ship.entity';
import { SingleChatMsg } from 'src/chat/entities/single-chat-msg-entity';
import { GroupChatMsg } from './entities/group-chat-msg-entity';
import { UserModule } from 'src/user/user.module';
import { OpenWindowTime } from './entities/open-window-time.entity';
import { UserService } from 'src/user/user.service';
import { Friends } from 'src/user/entities/friends.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Friends,
      ChatRoom,
      UserRoomShip,
      SingleChatMsg,
      GroupChatMsg,
      OpenWindowTime,
    ]),
    UserModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, JwtAuthGuard, AuthServerAuthGuard, UserService],
  exports: [ChatService],
})
export class ChatModule {}
