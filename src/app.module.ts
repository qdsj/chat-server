import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatSocketModule } from './chat-socket/chat-socket.module';
import { ChatModule } from './chat/chat.module';
import { AuthServerConfig } from './microService/AuthServer';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDataBaseConfig } from './database/database-config';
import { JwtAuthGuard } from './guards/jwt.auth';
import { AuthServerAuthGuard } from './guards/authService.auth';

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
      secret: 'zllb',
      signOptions: { expiresIn: '1d' },
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
