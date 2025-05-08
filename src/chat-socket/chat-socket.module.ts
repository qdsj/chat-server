import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from 'src/chat/chat.module';
import { GroupChatMsg } from 'src/chat/entities/group-chat-msg-entity';
import { OpenWindowTime } from 'src/chat/entities/open-window-time.entity';
import { ChatRoom } from '../chat/entities/chat-room-entity';
import { SingleChatMsg } from '../chat/entities/single-chat-msg-entity';
import { UserRoomShip } from '../chat/entities/user-room-ship.entity';
import { ChatSocketGateway } from './chat-socket.gateway';
import { ChatSocketService } from './chat-socket.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoom,
      UserRoomShip,
      SingleChatMsg,
      GroupChatMsg,
      OpenWindowTime,
    ]),
    ChatModule,
    UserModule,
  ],
  providers: [ChatSocketGateway, ChatSocketService],
})
export class ChatSocketModule {}
