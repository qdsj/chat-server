import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatService } from 'src/chat/chat.service';
import { OpenWindowTime } from 'src/chat/entities/open-window-time.entity';
import { SessionList } from 'src/chat/entities/session.entity';
import { UserRoomShip } from 'src/chat/entities/user-room-ship.entity';
import { Friends } from 'src/user/entities/friends.entity';
import { UserService } from 'src/user/user.service';
import { generateRoomId, getChatRoomIdByUserId } from 'src/util';
import { Repository } from 'typeorm';

@Injectable()
export class SessionService {
  @InjectRepository(SessionList)
  private SessionRepository: Repository<SessionList>;

  @InjectRepository(Friends)
  private FriendRepository: Repository<Friends>;

  @InjectRepository(UserRoomShip)
  private UserRoomShipRepository: Repository<UserRoomShip>;

  @InjectRepository(OpenWindowTime)
  private OpenWindowTimeRepository: Repository<OpenWindowTime>;

  @Inject(UserService)
  private userService: UserService;

  constructor(
    @Inject(ChatService)
    private chatService: ChatService,
  ) {}

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
  @OnEvent('session.deleteSession')
  async deleteSession(params: {
    room: { id: string; type: 'person' | 'group' };
    user: { id: string };
  }) {
    console.log('delete session');
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
      // throw new Error('会话不存在');
      console.log('会话不存在');
      return 'success';
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
    return await Promise.all(
      sessionList.map(async (item) => {
        const sessionTime = await this.OpenWindowTimeRepository.findOne({
          where: {
            userId: item.userId,
            roomId: item.roomId,
          },
        });

        let userInfo = null,
          roomInfo = null,
          roomId = item.roomId;
        if (item.type === 'person') {
          const friendId = getChatRoomIdByUserId({
            senderId: params.user.id,
            roomId: item.roomId,
          });

          userInfo = await this.userService.findUserById(friendId);

          roomId = getChatRoomIdByUserId({
            senderId: params.user.id,
            roomId: item.roomId,
          });
        } else {
          try {
            roomInfo = await this.chatService.findChatRoomById({
              id: item.roomId,
            });

            // 获取群成员信息
            const count = await this.chatService.getGroupMembersCount({
              roomId: item.roomId,
              userId: params.user.id,
            });
            roomInfo.count = count;
          } catch {
            return null;
          }
        }

        return {
          ...item,
          roomId,
          openTime: sessionTime?.openTime || new Date(),
          roomInfo: userInfo || roomInfo,
        };
      }),
    )
      .then((res) => {
        return res.filter(Boolean);
      })
      .then((res) => {
        res.sort((a, b) => {
          return (
            new Date(b.openTime).getTime() - new Date(a.openTime).getTime()
          );
        });
        return res;
      });
  }
}
