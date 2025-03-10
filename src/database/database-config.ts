import { ConfigService } from '@nestjs/config';
import { Friends } from 'src/user/entities/friends.entity';

export const getDataBaseConfig = (configService: ConfigService) => {
  return {
    type: 'mysql',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    entities: [Friends],
    synchronize: true,
    poolSize: 5,
    logging: true,
    connectorPackage: 'mysql2',
    extra: {
      authPlugins: 'sha256_password',
    },
  };
};
