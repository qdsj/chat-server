import { Module } from '@nestjs/common';
import { ChatSocketService } from './chat-socket.service';
import { ChatSocketGateway } from './chat-socket.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from './entities/chat-room-entity';
import { UserRoomShip } from './entities/user-room-ship.entity';
import { SingleChatMsg } from './entities/single-chat-msg-entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, UserRoomShip, SingleChatMsg])],
  providers: [ChatSocketGateway, ChatSocketService],
})
export class ChatSocketModule {}
