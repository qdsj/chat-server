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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoom,
      UserRoomShip,
      SingleChatMsg,
      GroupChatMsg,
    ]),
    UserModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, JwtAuthGuard, AuthServerAuthGuard],
  exports: [ChatService],
})
export class ChatModule {}
