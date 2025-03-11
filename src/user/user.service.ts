import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friends } from './entities/friends.entity';

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
      return friendObj; // 只返回业务数据
    }
    throw new Error('添加好友失败'); // 抛出异常而不是返回特定格式
  }

  async getRequestList(id: string) {
    const users = await this.friendsRepository.find({
      where: [
        {
          userId: id,
        },
        {
          friendId: id,
        },
      ],
    });
    const tasks = [];
    users.forEach((user) => {
      tasks.push(
        new Promise(async (resolve) => {
          const isRequester = user.userId === id;
          const friendObj = await this.findUserById(
            isRequester ? user.friendId : user.userId,
          );
          if (friendObj) {
            resolve({
              ...friendObj,
              status: user.status,
              isRequester,
            });
          } else {
            resolve(null);
          }
        }),
      );
    });
    const usersInfo = await Promise.all(tasks);

    return usersInfo.filter(Boolean);
  }

  async agreeFriend(id: string, friendId: string) {
    const friendObj = await this.findUserById(friendId);
    if (!friendObj) {
      throw new BadRequestException('用户不存在');
    }

    const friendShip = await this.friendsRepository.findOneBy([
      { userId: friendId, friendId: id },
    ]);

    if (!friendShip) {
      throw new BadRequestException(`${friendObj.username}没有发出好友申请`);
    }
    friendShip.status = 'accepted';
    const res = await this.friendsRepository.save(friendShip);
    if (!res) {
      throw new Error('同意失败');
    }
    return res;
  }

  async blockFriend() {}
}
