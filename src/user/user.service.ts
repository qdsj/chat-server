import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friends, FriendShipType } from './entities/friends.entity';
import { ChatRoom } from 'src/chat-socket/entities/chat-room-entity';
import { UserRoomShip } from 'src/chat-socket/entities/user-room-ship.entity';
import { generateRoomId } from 'src/util';

@Injectable()
export class UserService {
  @InjectRepository(Friends)
  private friendsRepository: Repository<Friends>;

  @InjectRepository(ChatRoom)
  private chatRoomRepository: Repository<ChatRoom>;

  @InjectRepository(UserRoomShip)
  private userRoomShipRepository: Repository<UserRoomShip>;

  @Inject('AUTH_SERVICE')
  private authService: ClientProxy;

  findUserByNameOrEmail(params: { username?: string; email?: string }) {
    return this.authService.send('findUserByNameOrEmail', params).toPromise();
  }

  findUserById(id: string) {
    return this.authService.send('findUserById', id).toPromise();
  }

  async getFriendList(id: string) {
    const friendList = await this.friendsRepository.find({
      where: [
        {
          userId: id,
          status: 'accepted',
        },
        {
          friendId: id,
          status: 'accepted',
        },
      ],
    });

    if (!friendList) {
      return [];
    }
    const tasks = [];
    friendList.forEach((friend) => {
      tasks.push(
        new Promise(async (resolve) => {
          const isRequester = friend.userId === id;
          const friendObj = await this.findUserById(
            isRequester ? friend.friendId : friend.userId,
          );
          if (friendObj) {
            resolve({
              ...friendObj,
              status: friend.status,
              requestMessage: friend.requestMessage,
              isRequester: !isRequester,
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

  isFriendShip(id: string, friendId: string, status?: FriendShipType) {
    const whereArr = [
      {
        userId: id,
        friendId,
      },
      {
        userId: friendId,
        friendId: id,
      },
    ] as any;
    if (status) {
      whereArr.forEach((item) => {
        item.status = status;
      });
    }
    return this.friendsRepository.findOneBy(whereArr);
  }

  async addFriend(userId: string, friendId: string, requestMessage: string) {
    // check friendId is Exist
    const friendObj = await this.findUserById(friendId);

    if (!friendObj) {
      throw new BadRequestException('好友不存在');
    }

    if (await this.isFriendShip(userId, friendId)) {
      throw new BadRequestException('已经是好友关系');
    }
    const friendsRecord = new Friends();
    friendsRecord.userId = userId;
    friendsRecord.friendId = friendId;
    friendsRecord.requestMessage = requestMessage;
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
              requestMessage: user.requestMessage,
              isRequester: !isRequester,
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

    const friendShip = await this.friendsRepository.findOneBy({
      userId: friendId,
      friendId: id,
    });

    if (!friendShip) {
      throw new BadRequestException(`${friendObj.username}没有发出好友申请`);
    } else if (friendShip.status !== 'pending') {
      throw new BadRequestException('已经是好友关系');
    }

    friendShip.status = 'accepted';
    const res = await this.friendsRepository.save(friendShip);
    const roomId = generateRoomId(id, friendId);
    this.chatRoomRepository.save({
      type: 'person',
      name: roomId,
      avatar: '',
      description: `${id}-${friendId}的单聊聊天室`,
    });

    this.userRoomShipRepository.save([
      { roomId: roomId, userId: id },
      { roomId: roomId, userId: friendId },
    ]);

    if (!res) {
      throw new Error('同意失败');
    }
    return res;
  }

  async blockFriend(id: string, friendId: string) {
    const friendObj = await this.findUserById(friendId);
    if (!friendObj) {
      throw new BadRequestException('用户不存在');
    }

    const friendShip = await this.friendsRepository.findOneBy([
      {
        userId: friendId,
        friendId: id,
      },
      {
        userId: id,
        friendId: friendId,
      },
    ]);

    if (!friendShip || friendShip.status !== 'accepted') {
      throw new BadRequestException(`${friendObj.username}与你不是好友关系`);
    }
    friendShip.status = 'blocked';
    const res = await this.friendsRepository.save(friendShip);
    if (!res) {
      throw new Error('拉黑失败');
    }
    return res;
  }

  async unblockFriend(id: string, friendId: string) {
    const friendObj = await this.findUserById(friendId);
    if (!friendObj) {
      throw new BadRequestException('用户不存在');
    }

    const friendShip = await this.friendsRepository.findOneBy([
      {
        userId: friendId,
        friendId: id,
      },
      {
        userId: id,
        friendId: friendId,
      },
    ]);

    if (!friendShip) {
      throw new BadRequestException(`${friendObj.username}与你不是好友关系`);
    }
    if (friendShip.status !== 'blocked') {
      throw new BadRequestException(`${friendObj.username}没有被你拉黑`);
    }
    friendShip.status = 'accepted';
    const res = await this.friendsRepository.save(friendShip);
    if (!res) {
      throw new Error('恢复好友关系失败');
    }
    return res;
  }
}
