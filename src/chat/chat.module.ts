import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from 'src/chat/entities/chat-room-entity';
import { SingleChatMsg } from 'src/chat/entities/single-chat-msg-entity';
import { UserRoomShip } from 'src/chat/entities/user-room-ship.entity';
import { Friends } from 'src/user/entities/friends.entity';
import { UserModule } from 'src/user/user.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GroupChatMsg } from './entities/group-chat-msg-entity';
import { OpenWindowTime } from './entities/open-window-time.entity';

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
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
