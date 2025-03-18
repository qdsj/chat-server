import { ConfigService } from '@nestjs/config';
import { ChatRoom } from 'src/chat-socket/entities/chat-room-entity';
import { OpenWindowTime } from 'src/chat-socket/entities/open-window-time.entity';
import { SingleChatMsg } from 'src/chat-socket/entities/single-chat-msg-entity';
import { UserRoomShip } from 'src/chat-socket/entities/user-room-ship.entity';
import { Friends } from 'src/user/entities/friends.entity';

export const getDataBaseConfig = (configService: ConfigService) => {
  console.log(configService.get('DB_DATABASE'));
  return {
    type: 'mysql',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    entities: [Friends, SingleChatMsg, OpenWindowTime, ChatRoom, UserRoomShip],
    synchronize: true,
    poolSize: 5,
    logging: false,
    connectorPackage: 'mysql2',
    extra: {
      authPlugins: 'sha256_password',
    },
  };
};
