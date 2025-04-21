import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { Session } from 'src/chat/entities/session.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friends } from 'src/user/entities/friends.entity';
import { UserRoomShip } from 'src/chat/entities/user-room-ship.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Friends, UserRoomShip])],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
