import { Inject, Injectable } from '@nestjs/common';
import { UserService } from './user/user.service';

@Injectable()
export class AppService {
  @Inject(UserService)
  private userServices: UserService;
  getUserInfo(id: string) {
    return this.userServices.findUserById(id);
  }
}
