import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatSocketModule } from './chat-socket/chat-socket.module';
import { ChatModule } from './chat/chat.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    ChatSocketModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'zllb',
      signOptions: { expiresIn: '1d' },
    }),
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
