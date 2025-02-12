import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          console.log(
            configService.get('AUTH_SERVICE_HOST'),
            configService.get('AUTH_SERVICE_PORT'),
          );
          return {
            transport: Transport.TCP,
            options: {
              host: configService.get('AUTH_SERVICE_HOST'),
              port: Number(configService.get('AUTH_SERVICE_PORT')),
            },
          };
        },
      },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
