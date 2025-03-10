import { Module } from '@nestjs/common';
import { AuthServerAuthGuard } from 'src/guards/authService.auth';
import { JwtAuthGuard } from 'src/guards/jwt.auth';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [],
  controllers: [ChatController],
  providers: [ChatService, JwtAuthGuard, AuthServerAuthGuard],
})
export class ChatModule {}
