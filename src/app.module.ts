import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatSocketModule } from './chat-socket/chat-socket.module';
import { ChatModule } from './chat/chat.module';
import { AuthServerConfig } from './microService/AuthServer';
import { UserModule } from './user/user.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : ['.env', '.env.local'],
    }),
    ChatSocketModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'zllb',
      signOptions: { expiresIn: '1d' },
    }),
    ChatModule,
    UserModule,
    ClientsModule.registerAsync([AuthServerConfig()]),
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [ClientsModule],
})
export class AppModule {}
