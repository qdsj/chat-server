import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatSocketModule } from './chat-socket/chat-socket.module';
import { ChatModule } from './chat/chat.module';
import { getDataBaseConfig } from './database/database-config';
import { AuthServerAuthGuard } from './guards/authService.auth';
import { JwtAuthGuard } from './guards/jwt.auth';
import { AuthServerConfig } from './microService/AuthServer';
import { UserModule } from './user/user.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.production'],
    }),
    ChatSocketModule,
    JwtModule.register({
      global: true,
      secret: 'chat-server-zllb',
      signOptions: { expiresIn: '30d' },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return getDataBaseConfig(configService) as any;
      },
    }),
    ChatModule,
    UserModule,
    ClientsModule.registerAsync([AuthServerConfig()]),
  ],
  controllers: [AppController],
  providers: [AppService, JwtAuthGuard, AuthServerAuthGuard],
  exports: [ClientsModule],
})
export class AppModule {}
