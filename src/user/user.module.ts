import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/guards/jwt.auth';
import { AuthServerAuthGuard } from 'src/guards/authService.auth';

@Module({
  // imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, JwtAuthGuard, AuthServerAuthGuard],
})
export class UserModule {}
