import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/guards/jwt.auth';
import { AuthServerAuthGuard } from 'src/guards/authService.auth';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friends } from './entities/friends.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Friends])],
  controllers: [UserController],
  providers: [UserService, JwtAuthGuard, AuthServerAuthGuard],
  exports: [UserService],
})
export class UserModule {}
