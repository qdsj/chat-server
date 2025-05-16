import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatSocketServiceMethodParams } from 'src/chat-socket/chat-socket.service';
import { ChatServiceMethodParams } from 'src/chat/chat.service';
import { ServerMsgTypeEnum } from 'src/chat/entities/single-chat-msg-entity';
import { UserRoomShip } from 'src/chat/entities/user-room-ship.entity';
import { generateRoomId } from 'src/util';
import { Not, Repository } from 'typeorm';
import { Friends, FriendShipType } from './entities/friends.entity';

@Injectable()
export class UserService {
  @InjectRepository(Friends)
  private friendsRepository: Repository<Friends>;

  @InjectRepository(UserRoomShip)
  private userRoomShipRepository: Repository<UserRoomShip>;

  @Inject('AUTH_SERVICE')
  private authService: ClientProxy;

  @Inject(EventEmitter2)
  private eventEmitter: EventEmitter2;

  async findUserByNameOrEmail(params: {
    userId: string;
    username?: string;
    email?: string;
  }) {
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
          receiverId: params.userId,
        },
        {
          receiverId: user.id,
          requesterId: params.userId,
        },
      ],
    });

    console.log(friendShip);

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

  /* 通过关系列表，获取用户信息 */
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

  /* 判断好友关系 */
  async isFriendShip(
    id: string,
    receiverId: string,
    status?: FriendShipType,
    checkIsFriend = true,
  ) {
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
    if (checkIsFriend && !friendObj) {
      throw new BadRequestException(`彼此不是好友`);
    }
    return friendObj;
  }

  emitAsync<T>(event: string, data: T) {
    return this.eventEmitter.emitAsync(event, data);
  }
  sendServerMessage(
    params: ChatSocketServiceMethodParams['sendServerMessage'][0],
  ) {
    return this.emitAsync('socket.sendServerMessage', params);
  }

  sendFakeMessage(
    params: ChatSocketServiceMethodParams['sendMessageFakeUser'][0],
  ) {
    return this.emitAsync('socket.sendMessageFakeUser', params);
  }

  /* 发出好友申请 */
  async addFriend(params: {
    requesterName: string;
    requesterId: string;
    receiverId: string;
    requestMessage: string;
  }) {
    const { requesterName, requesterId, receiverId, requestMessage } = params;
    // check receiverId is Exist
    const friendObj = await this.findUserById(receiverId);

    const friendShip = await this.isFriendShip(
      requesterId,
      receiverId,
      null,
      false,
    );
    // || friendShip.requesterId !== requesterId
    if (!friendShip) {
      const friendsRecord = new Friends();
      friendsRecord.requesterId = requesterId;
      friendsRecord.receiverId = receiverId;
      friendsRecord.requestMessage = requestMessage;
      friendsRecord.status = 'pending';
      await this.friendsRepository.save([friendsRecord]);
    }

    this.sendServerMessage({
      receiverId: receiverId,
      message: `收到一条来自${requesterName}好友申请`,
      msgType: ServerMsgTypeEnum['request-friend'],
    });
    return friendObj; // 只返回业务数据O
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

  /* 同意好友申请 */
  async agreeFriend(params: {
    id: string;
    username: string;
    receiverId: string;
  }) {
    const { id, username, receiverId } = params;
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
    const res = await this.friendsRepository.update(friendShip.id, friendShip);

    const roomId = generateRoomId(id, receiverId);

    // 创建聊天室
    await this.emitAsync<ChatServiceMethodParams['createChatRoom'][0]>(
      'chat.createChatRoom',
      {
        type: 'person',
        name: roomId,
      },
    );

    await this.userRoomShipRepository.save([
      { roomId: roomId, userId: id },
      { roomId: roomId, userId: receiverId },
    ]);

    this.sendServerMessage({
      receiverId: receiverId,
      message: `${username}同意了你的好友申请`,
      msgType: ServerMsgTypeEnum['agree-friend'],
    });

    this.sendFakeMessage({
      senderId: receiverId, // 发送好友申请的一位
      receiverId: id,
      type: 'person',
      msgType: 'text',
      message: friendShip.requestMessage,
    });

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
