import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from 'src/chat/entities/chat-room-entity';
import { UserRoomShip } from 'src/chat/entities/user-room-ship.entity';
import { generateRoomId } from 'src/util';
import { Not, Repository } from 'typeorm';
import { Friends, FriendShipType } from './entities/friends.entity';

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

  async findUserByNameOrEmail(params: { username?: string; email?: string }) {
    const user: { id: string } = await this.authService
      .send('findUserByNameOrEmail', params)
      .toPromise();

    if (!user) {
      return null;
    }
    const friendShip = await this.friendsRepository.findOne({
      where: [
        {
          requesterId: user.id,
        },
        {
          receiverId: user.id,
        },
      ],
    });

    if (!friendShip) {
      return { ...user, friendShip: null };
    }

    return { ...user, friendShip };
  }

  async findUserById(id: string) {
    const friendObj = await this.authService
      .send('findUserById', id)
      .toPromise();
    if (!friendObj) {
      throw new BadRequestException('用户不存在');
    }
    return friendObj;
  }

  async getFriendList(id: string) {
    const friendList = await this.friendsRepository.find({
      where: [
        {
          requesterId: id,
          status: 'accepted',
        },
        {
          receiverId: id,
          status: 'accepted',
        },
        {
          blockerId: Not(id),
          status: 'blocked',
        },
      ],
    });

    if (!friendList) {
      return [];
    }

    const userMap = {};
    const userList = await this.getUserInfoByList(friendList, (friend) => {
      return friend.requesterId !== id ? 'requesterId' : 'receiverId';
    });

    userList.forEach((user) => {
      userMap[user.id] = user;
    });

    return Object.values(userMap);
  }

  // 获取拉黑好友列表--主动拉黑的好友
  async getBlockList(id: string) {
    const blockList = await this.friendsRepository.find({
      where: [
        {
          status: 'blocked',
          blockerId: id,
        },
      ],
    });

    if (!blockList) {
      return [];
    }

    return this.getUserInfoByList(blockList, (friend) => {
      return friend.requesterId !== friend.blockerId
        ? 'requesterId'
        : 'receiverId';
    });
  }

  // 通过关系列表，获取用户信息
  getUserInfoByList(
    friends: Friends[],
    key: string | ((friend: Friends) => string),
  ) {
    const tasks = [];
    friends.forEach((friend) => {
      tasks.push(
        new Promise(async (resolve) => {
          let _key = '';
          if (typeof key === 'function') {
            _key = key(friend);
          }
          const friendObj = await this.findUserById(friend[_key]);
          if (friendObj) {
            resolve({
              ...friendObj,
              friendShip: friend,
            });
          } else {
            resolve(null);
          }
        }),
      );
    });
    return Promise.all(tasks).then((users) => users.filter(Boolean));
  }

  async isFriendShip(id: string, receiverId: string, status?: FriendShipType) {
    const whereArr = [
      {
        requesterId: id,
        receiverId,
      },
      {
        requesterId: receiverId,
        receiverId: id,
      },
    ] as any;
    if (status) {
      whereArr.forEach((item) => {
        item.status = status;
      });
    }
    const friendObj = await this.friendsRepository.findOneBy(whereArr);
    if (!friendObj) {
      throw new BadRequestException(`彼此不是好友`);
    }
    return friendObj;
  }

  async addFriend(
    requesterId: string,
    receiverId: string,
    requestMessage: string,
  ) {
    // check receiverId is Exist
    const friendObj = await this.findUserById(receiverId);

    if (!friendObj) {
      throw new BadRequestException('好友不存在');
    }

    if (await this.isFriendShip(requesterId, receiverId)) {
      throw new BadRequestException('已经是好友关系');
    }
    const friendsRecord = new Friends();
    friendsRecord.requesterId = requesterId;
    friendsRecord.receiverId = receiverId;
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
          requesterId: id,
        },
        {
          receiverId: id,
        },
      ],
    });

    if (!users) {
      return [];
    }
    return this.getUserInfoByList(users, (friend) => {
      return friend.requesterId !== id ? 'requesterId' : 'receiverId';
    });
  }

  async agreeFriend(id: string, receiverId: string) {
    const friendObj = await this.findUserById(receiverId);
    if (!friendObj) {
      throw new BadRequestException('用户不存在');
    }

    const friendShip = await this.friendsRepository.findOneBy({
      requesterId: receiverId,
      receiverId: id,
    });

    if (!friendShip) {
      throw new BadRequestException(`${friendObj.username}没有发出好友申请`);
    } else if (friendShip.status === 'blocked') {
      throw new BadRequestException('已经被拉黑');
    } else if (friendShip.status === 'accepted') {
      throw new BadRequestException('已经是好友关系');
    }

    friendShip.status = 'accepted';
    const res = await this.friendsRepository.save(friendShip);
    const roomId = generateRoomId(id, receiverId);
    this.chatRoomRepository.save({
      type: 'person',
      name: roomId,
      avatar: '',
      description: `${id}-${receiverId}的单聊聊天室`,
    });

    this.userRoomShipRepository.save([
      { roomId: roomId, userId: id },
      { roomId: roomId, userId: receiverId },
    ]);

    if (!res) {
      throw new Error('同意失败');
    }
    return res;
  }

  async blockFriend(params: { id: string; name: string; receiverId: string }) {
    const { id, name, receiverId } = params;
    const friendObj = await this.findUserById(receiverId);
    const friendShip = await this.isFriendShip(id, receiverId, 'accepted');
    friendShip.status = 'blocked';
    friendShip.blockerId = id;
    const res = await this.friendsRepository.save(friendShip);
    if (!res) {
      throw new Error('拉黑失败');
    }
    return {
      blockerId: id,
      blockerName: name,
      beBlocked: receiverId,
      beBlockedName: friendObj.username,
    };
  }

  async unblockFriend(id: string, receiverId: string) {
    await this.findUserById(receiverId);

    const friendShip = await this.isFriendShip(id, receiverId, 'blocked');

    friendShip.status = 'accepted';
    const res = await this.friendsRepository.update(friendShip.id, friendShip);
    if (!res) {
      throw new Error('恢复好友关系失败');
    }
    return friendShip;
  }
}
