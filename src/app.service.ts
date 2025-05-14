import { Inject, Injectable } from '@nestjs/common';
import { UserService } from './user/user.service';
import { UserInfoDto } from './user/dto/user.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService {
  @Inject(UserService)
  private userServices: UserService;

  @Inject('AUTH_SERVICE')
  private authService: ClientProxy;

  getUserInfo(id: string) {
    return this.userServices.findUserById(id);
  }

  async updateUserInfo(id, updateUserInfoDto: UserInfoDto) {
    const res = await this.authService
      .send('updateUserInfo', { ...updateUserInfoDto, id })
      .toPromise();
    if (res.status === 'success') {
      return this.userServices.findUserById(id);
    } else {
      console.log(res);
      throw res;
    }
  }
}
