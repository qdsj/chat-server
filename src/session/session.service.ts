import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionList } from 'src/chat/entities/session.entity';
import { UserRoomShip } from 'src/chat/entities/user-room-ship.entity';
import { Friends } from 'src/user/entities/friends.entity';
import { generateRoomId } from 'src/util';
import { Repository } from 'typeorm';

@Injectable()
export class SessionService {
  @InjectRepository(SessionList)
  private SessionRepository: Repository<SessionList>;

  @InjectRepository(Friends)
  private FriendRepository: Repository<Friends>;

  @InjectRepository(UserRoomShip)
  private UserRoomShipRepository: Repository<UserRoomShip>;

  // 增加一个session
  async addSession(params: {
    room: { id: string; type: 'person' | 'group' };
    user: { id: string };
  }) {
    let roomId = params.room.id;
    // 如果是person， 判断用户是否和person为好友
    if (params.room.type === 'person') {
      const friends = await this.FriendRepository.findOne({
        where: [
          { receiverId: params.user.id, requesterId: params.room.id },
          { receiverId: params.room.id, requesterId: params.user.id },
        ],
      });

      if (!friends) {
        throw new Error('不是好友, 不能添加会话');
      }

      roomId = generateRoomId(params.user.id, params.room.id);
    }
    // 判断用户是否在room中，如果是group
    else if (params.room.type === 'group') {
      const userRoomShips = await this.UserRoomShipRepository.findOne({
        where: {
          roomId: params.room.id,
          userId: params.user.id,
        },
      });

      if (!userRoomShips) {
        throw new Error('不是群成员， 不能添加会话');
      }
    }

    // 判断session是否存在
    const session = await this.SessionRepository.findOne({
      where: {
        userId: params.user.id,
        roomId: roomId,
      },
    });

    if (session && session.isDeleted === false) {
      throw new Error('会话已存在');
    }

    if (session && session.isDeleted === true) {
      // 会话被软删除了
      session.isDeleted = false;
      await this.SessionRepository.update(session.id, session);
      return session;
    } else {
      // 创建session
      const newSession = await this.SessionRepository.save({
        userId: params.user.id,
        roomId: roomId,
        type: params.room.type,
      });

      return newSession;
    }
  }

  // 删除一个session
  async deleteSession(params: {
    room: { id: string; type: 'person' | 'group' };
    user: { id: string };
  }) {
    // 判断session是否存在
    let roomId = params.room.id;
    if (params.room.type === 'person') {
      roomId = generateRoomId(params.user.id, params.room.id);
    }

    const session = await this.SessionRepository.findOne({
      where: {
        userId: params.user.id,
        roomId: roomId,
      },
    });

    if (!session || session.isDeleted === true) {
      throw new Error('会话不存在');
    }
    // 删除session
    session.isDeleted = true;
    await this.SessionRepository.update(session.id, session);

    return 'success';
  }

  // 获取session列表
  async getSessionList(params: { user: { id: string } }) {
    const sessionList = await this.SessionRepository.find({
      where: {
        userId: params.user.id,
        isDeleted: false,
      },
    });
    return sessionList;
  }
}
