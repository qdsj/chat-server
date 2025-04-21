import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { SessionList } from 'src/chat/entities/session.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friends } from 'src/user/entities/friends.entity';
import { UserRoomShip } from 'src/chat/entities/user-room-ship.entity';
import { OpenWindowTime } from 'src/chat/entities/open-window-time.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionList,
      Friends,
      UserRoomShip,
      OpenWindowTime,
    ]),
  ],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
