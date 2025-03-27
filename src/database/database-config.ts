import { ConfigService } from '@nestjs/config';
import { ChatRoom } from 'src/chat/entities/chat-room-entity';
import { GroupChatMsg } from 'src/chat/entities/group-chat-msg-entity';
import { OpenWindowTime } from 'src/chat/entities/open-window-time.entity';
import { SingleChatMsg } from 'src/chat/entities/single-chat-msg-entity';
import { UserRoomShip } from 'src/chat/entities/user-room-ship.entity';
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
    entities: [
      Friends,
      SingleChatMsg,
      OpenWindowTime,
      ChatRoom,
      UserRoomShip,
      GroupChatMsg,
    ],
    synchronize: true,
    poolSize: 5,
    logging: false,
    connectorPackage: 'mysql2',
    extra: {
      authPlugins: 'sha256_password',
    },
  };
};
