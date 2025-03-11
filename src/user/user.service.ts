import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Friends } from './entities/friends.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UserService {
  @InjectRepository(Friends)
  private friendsRepository: Repository<Friends>;

  @Inject('AUTH_SERVICE')
  private authService: ClientProxy;

  findUserByNameOrEmail(params: { username?: string; email?: string }) {
    return this.authService.send('findUserByNameOrEmail', params).toPromise();
  }

  findUserById(id: string) {
    return this.authService.send('findUserById', id).toPromise();
  }

  async addFriend(userId: string, friendId: string) {
    // check friendId is Exist
    const friendObj = await this.findUserById(friendId);

    if (!friendObj) {
      throw new BadRequestException('好友不存在');
    }

    const friendsRecord = new Friends();
    friendsRecord.userId = userId;
    friendsRecord.friendId = friendId;
    friendsRecord.status = 'pending';

    const res = await this.friendsRepository.save([friendsRecord]);
    if (res.length > 0) {
      return { status: 'success', data: friendObj };
    }
    return {
      status: 'failed',
      data: null,
    };
  }
}
