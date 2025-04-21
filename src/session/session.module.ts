import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenWindowTime } from 'src/chat/entities/open-window-time.entity';
import { SessionList } from 'src/chat/entities/session.entity';
import { UserRoomShip } from 'src/chat/entities/user-room-ship.entity';
import { Friends } from 'src/user/entities/friends.entity';
import { UserModule } from 'src/user/user.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { ChatRoom } from 'src/chat/entities/chat-room-entity';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionList,
      Friends,
      UserRoomShip,
      OpenWindowTime,
      ChatRoom,
    ]),
    UserModule,
    ChatModule,
  ],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
