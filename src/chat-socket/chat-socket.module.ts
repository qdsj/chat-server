import { Module } from '@nestjs/common';
import { ChatSocketService } from './chat-socket.service';
import { ChatSocketGateway } from './chat-socket.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from '../chat/entities/chat-room-entity';
import { UserRoomShip } from '../chat/entities/user-room-ship.entity';
import { SingleChatMsg } from '../chat/entities/single-chat-msg-entity';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, UserRoomShip, SingleChatMsg]),
    ChatModule,
  ],
  providers: [ChatSocketGateway, ChatSocketService],
})
export class ChatSocketModule {}
