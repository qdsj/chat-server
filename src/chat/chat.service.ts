import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from 'src/chat/entities/chat-room-entity';
import { SingleChatMsg } from 'src/chat/entities/single-chat-msg-entity';
import {
  RoomShipType,
  RoomUserType,
  UserRoomShip,
} from 'src/chat/entities/user-room-ship.entity';
import { UserService } from 'src/user/user.service';
import { generateRoomId } from 'src/util';
import { Repository } from 'typeorm';
import { ChatRoomInfo } from './dto/chat.dto';
import { User } from './dto/user.dto';
import { GroupChatMsg } from './entities/group-chat-msg-entity';
import { OpenWindowTime } from './entities/open-window-time.entity';
import { GROUP_AVATAR } from 'src/constant/img';

@Injectable()
export class ChatService {
  @InjectRepository(ChatRoom)
  private chatRoomRepository: Repository<ChatRoom>;

  @InjectRepository(UserRoomShip)
  private userRoomShipRepository: Repository<UserRoomShip>;

  @InjectRepository(SingleChatMsg)
  private singleChatMsgRepository: Repository<SingleChatMsg>;

  @InjectRepository(GroupChatMsg)
  private groupChatMsgRepository: Repository<GroupChatMsg>;

  @InjectRepository(OpenWindowTime)
  private openWindowTimeRepository: Repository<OpenWindowTime>;

  @Inject(UserService)
  private userService: UserService;

  // 打开聊天窗口
  async openChatWindow(params: {
    user: User;
    roomId: string;
    type: 'person' | 'group';
  }) {
    let roomId = params.roomId;
    if (params.type === 'person') {
      roomId = generateRoomId(params.user.id, params.roomId);
    }

    let windowTime = await this.openWindowTimeRepository.findOneBy({
      userId: params.user.id,
      roomId,
    });

    if (!windowTime) {
      windowTime = {
        userId: params.user.id,
        roomId,
        openTime: new Date(),
      } as any;

      const result = await this.openWindowTimeRepository.save(windowTime);
      return result;
    }

    windowTime.openTime = new Date();

    await this.openWindowTimeRepository.update(windowTime.id, windowTime);

    return windowTime;
  }

  // 获取一个聊天窗口列表
  async getChatWindowListByRoomId(params: {
    user: User;
    rooms: { type: 'person' | 'group'; roomId: string }[];
  }) {
    const windowTimes = await Promise.all(
      params.rooms.map(async (item) => {
        let roomId = item.roomId;
        if (item.type !== 'group') {
          roomId = generateRoomId(params.user.id, item.roomId);
        }
        return {
          type: item.type,
          ...((await this.openWindowTimeRepository.findOne({
            where: {
              userId: params.user.id,
              roomId,
            },
          })) || {
            userId: params.user.id,
            roomId,
            openTime: '',
            createAt: '',
          }),
          roomInfo: await (item.type === 'group'
            ? this.findChatRoomById({ id: roomId })
            : this.findChatRoomByName({ name: roomId })),
        };
      }),
    );
    return windowTimes;
  }

  // 获取所有聊天窗口列表
  async getAllChatWindowList(user: User) {
    return this.openWindowTimeRepository.find({
      where: { userId: user.id },
    });
  }

  // 获取单聊历史
  async getSingleChatHistory(user: User, friendId: string) {
    const roomId = generateRoomId(user.id, friendId);

    const res = await this.singleChatMsgRepository.find({ where: { roomId } });
    return res
      .map((item) => {
        item.roomId = friendId;
        (item as any).type = 'person';
        return item;
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // 获取群聊消息记录
  async getGroupChatHistory(params: { roomId: string; userId: string }) {
    const roomId = params.roomId;
    const userId = params.userId;
    // userId是否在该群聊内
    const roomShip = await this.userRoomShipRepository.findOneBy({
      roomId,
      userId,
    });
    if (!roomShip) {
      throw new HttpException('您不在该群聊内', HttpStatus.BAD_REQUEST);
    }
    const res = await this.groupChatMsgRepository.find({ where: { roomId } });
    return res
      .map((item) => {
        (item as any).type = 'group';
        return item;
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // 保存单聊消息
  async saveSingleMessage(params: Omit<SingleChatMsg, 'id'>) {
    await this.singleChatMsgRepository.save([{ ...params }]);
  }

  // 创建群聊
  async createGroupByAddMembers(params: {
    userId: string;
    memberIds: string[];
  }) {
    const members = await Promise.all(
      params.memberIds.slice(0, 3).map((id) => {
        return this.userService.findUserById(id) as Promise<User>;
      }),
    );

    const groupName =
      members.map((item) => item.username).join(', ') + '的群聊';
    // name, description, avatar
    const chatRoom = await this.chatRoomRepository.save([
      {
        name: groupName,
        description: '',
        avatar: GROUP_AVATAR,
        type: 'group',
      },
    ]);

    console.log('chatRoom', chatRoom, chatRoom[0]);

    // 创建者视为群主
    await this.addGroupMember({
      userId: params.userId,
      roomId: chatRoom[0].id,
      status: 'accepted',
      userType: 'owner',
    });

    await this.addGroupMembers({
      userIds: params.memberIds,
      roomId: chatRoom[0].id,
    });

    return chatRoom[0];
  }

  // 添加群成员
  async addGroupMember(params: {
    inviter?: User;
    userId: string;
    roomId: string;
    status?: RoomShipType;
    userType?: RoomUserType;
  }) {
    // 有邀请者的情况
    if (params.inviter) {
      const isInRoom = await this.userRoomShipRepository.findOneBy({
        roomId: params.roomId,
        userId: params.inviter.id,
      });

      if (!isInRoom) {
        throw new HttpException(
          params.inviter.username + ', 您不在该群聊内,无法邀请',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const rowData = await this.isInGroup({
      roomId: params.roomId,
      userId: params.userId,
    });

    if (rowData && rowData.status == 'accepted') {
      throw new HttpException('已在该群聊内', HttpStatus.BAD_REQUEST);
    }

    // 检查之前是否被拉黑
    if (rowData) {
      return this.updateGroupMemberStatus({
        roomId: params.roomId,
        userId: params.userId,
        status: 'accepted',
        userType: params?.userType || 'member',
      });
    }

    return await this.userRoomShipRepository.save([
      {
        userId: params.userId,
        roomId: params.roomId,
        type: 'group',
        status: 'accepted',
        userType: params?.userType || 'member',
      },
    ]);
  }

  // 检查是否在群聊内
  async isInGroup(params: { userId: string; roomId: string }) {
    await this.findChatRoomById({ id: params.roomId });
    const rowData = await this.userRoomShipRepository.findOneBy({
      roomId: params.roomId,
      userId: params.userId,
    });

    if (!rowData)
      throw new BadRequestException(params.userId + ' 用户不在该该群');

    return rowData;
  }

  // 更新群聊状态
  async updateGroupStatus(params: {
    userId: string;
    roomId: string;
    status: RoomShipType;
  }) {
    const { userId, roomId, status } = params;
    const rowData = await this.isInGroup({ userId, roomId });

    return this.userRoomShipRepository.update(rowData.id, {
      status,
    });
  }

  // 同意加入群聊
  async agreeJoinGroup(params: { userId: string; roomId: string }) {
    return this.addGroupMember({
      userId: params.userId,
      roomId: params.roomId,
      status: 'accepted',
      userType: 'member',
    });
  }

  // 更新群成员的状态
  async updateGroupMemberStatus(params: {
    userId: string;
    roomId: string;
    status: RoomShipType;
    userType?: RoomUserType;
  }) {
    // 找到群关系 rowData
    const rowData = await this.isInGroup({
      roomId: params.roomId,
      userId: params.userId,
    });

    // 将群关系设置为 params.status
    rowData.status = params.status;
    if (params.userType) rowData.userType = params.userType;
    await this.userRoomShipRepository.update(rowData.id, rowData);
    return true;
  }

  // 踢出群聊
  async kickGroupMember(params: {
    userId: string;
    beBlockerId: string;
    roomId: string;
  }) {
    return this.updateGroupMemberStatus({
      userId: params.beBlockerId,
      roomId: params.roomId,
      status: 'blocked',
    });
  }

  // 退出群聊
  async quitGroup(params: { userId: string; roomId: string }) {
    const { userId, roomId } = params;
    const rowData = await this.isInGroup({ userId, roomId });

    if (rowData.userType === 'owner') {
      throw new HttpException('群主无法退出群聊', HttpStatus.BAD_REQUEST);
    }

    return this.updateGroupMemberStatus({
      userId,
      roomId,
      status: 'blocked',
    });
  }

  // 获取群成员的信息
  async getGroupMembersInfo(params: { roomId: string; userId: string }) {
    const { roomId } = params;
    const res = await this.chatRoomRepository.find({ where: { id: roomId } });

    if (!res) throw new HttpException('群聊不存在', HttpStatus.BAD_REQUEST);

    return this.userRoomShipRepository
      .find({
        where: [{ roomId }],
      })
      .then((chatRoomShips) => {
        return Promise.all(
          chatRoomShips.map(async (chatRoomShip) => {
            return {
              chatRoomShipInfo: chatRoomShip,
              ...(await this.userService.findUserById(chatRoomShip.userId)),
            };
          }),
        );
      });
  }

  // 获取群成员的数量
  async getGroupMembersCount(params: { roomId: string; userId: string }) {
    const { roomId, userId } = params;
    const res = await this.userRoomShipRepository.findOne({
      where: { roomId, userId, status: 'accepted' },
    });

    if (!res) throw new HttpException('群聊不存在', HttpStatus.BAD_REQUEST);

    return this.userRoomShipRepository.countBy({ roomId });
  }

  // 检查群成员是否为管理员或群主
  async isGroupOwnerOrAdmin(params: { userId: string; roomId: string }) {
    const rowData = await this.isInGroup(params);

    if (rowData.userType !== 'admin' && rowData.userType !== 'owner') {
      throw new HttpException('没有权限', HttpStatus.BAD_REQUEST);
    }

    return true;
  }

  // 检查群成员是否为群主
  async isGroupOwner(params: { userId: string; roomId: string }) {
    const rowData = await this.isInGroup(params);
    if (rowData.userType !== 'owner') {
      throw new HttpException('没有权限', HttpStatus.BAD_REQUEST);
    }
    return true;
  }

  // 修改群聊信息
  async updateGroupInfo(params: ChatRoomInfo & { userId: string }) {
    await this.isGroupOwnerOrAdmin({
      userId: params.userId,
      roomId: params.roomId,
    });
    const roomId = params.roomId;

    const chatRoomInfo = await this.findChatRoomById({
      id: roomId,
    });
    delete params.userId;
    delete params.roomId;
    if ('id' in params) {
      delete params.id;
    }
    return await this.chatRoomRepository.update(roomId, {
      avatar: params.avatar || chatRoomInfo.avatar || GROUP_AVATAR,
      description: params.description || chatRoomInfo.description,
      name: params.name || chatRoomInfo.name,
    });
  }

  async findChatRoomById(params: { id: string }) {
    const { id } = params;
    const roomData = await this.chatRoomRepository.findOneBy({ id });
    if (!roomData)
      throw new HttpException('群聊不存在', HttpStatus.BAD_REQUEST);
    if (roomData.deleted)
      throw new HttpException('群聊已解散', HttpStatus.BAD_REQUEST);
    return roomData;
  }

  async findChatRoomByName(params: { name: string }) {
    const { name } = params;
    const roomData = await this.chatRoomRepository.findOneBy({ name });
    if (!roomData)
      throw new HttpException('群聊不存在', HttpStatus.BAD_REQUEST);
    if (roomData.deleted)
      throw new HttpException('群聊已解散', HttpStatus.BAD_REQUEST);
    return roomData;
  }

  // 解散群聊--软删除
  async dismissGroup(params: { userId: string; roomId: string }) {
    await this.isGroupOwner({
      userId: params.userId,
      roomId: params.roomId,
    });
    const chatRoom = await this.findChatRoomById({
      id: params.roomId,
    });
    chatRoom.deleted = true;
    return this.chatRoomRepository.update(chatRoom.id, chatRoom);
  }

  // 添加群消息
  async saveGroupMessage(params: Omit<GroupChatMsg, 'id'>) {
    await this.groupChatMsgRepository.save([{ ...params }]);
  }

  // 批量添加群成员
  async addGroupMembers(params: { userIds: string[]; roomId: string }) {
    try {
      await this.userRoomShipRepository.save(
        params.userIds.map((userId) => ({
          userId: userId,
          roomId: params.roomId,
          status: 'accepted',
        })),
      );
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  // 获取群列表
  async getGroupList(userId: string): Promise<ChatRoom[]> {
    const res = await this.userRoomShipRepository.find({ where: { userId } });
    if (res.length === 0) return [];

    return Promise.all(
      res.map(async (item) => {
        try {
          const info = await this.findChatRoomById({ id: item.roomId });
          // 没解散的群
          if (info?.type === 'group' && info.deleted === false) {
            (info as any).roomShip = item;
            return info;
          }
        } catch {
          return false;
        }
      }),
    ).then((res) => res.filter(Boolean)) as any;
  }

  // 设置群成员身份
  async setGroupMemberIdentity(params: {
    userId: string;
    roomId: string;
    beSetId: string;
    userType: RoomUserType;
  }) {
    await this.isGroupOwnerOrAdmin(params);

    const rowData = await this.isInGroup({
      userId: params.beSetId,
      roomId: params.roomId,
    });

    if (params.userId === params.beSetId) {
      throw new HttpException('群主无法变更为其他身份', HttpStatus.BAD_REQUEST);
    }

    return this.userRoomShipRepository.update(rowData.id, {
      userType: params.userType,
    });
  }

  // 设置群成员为管理员
  async setGroupMemberAdmin(params: {
    userId: string;
    roomId: string;
    beAdminId: string;
  }) {
    return this.setGroupMemberIdentity({
      userId: params.userId,
      roomId: params.roomId,
      beSetId: params.beAdminId,
      userType: 'admin',
    });
  }
  // 取消群成员为管理员
  async cancelGroupMemberAdmin(params: {
    userId: string;
    roomId: string;
    beAdminId: string;
  }) {
    return this.setGroupMemberIdentity({
      userId: params.userId,
      roomId: params.roomId,
      beSetId: params.beAdminId,
      userType: 'member',
    });
  }

  // 转让群主
  async transferGroupOwner(params: {
    userId: string;
    roomId: string;
    beOwnerId: string;
  }) {
    await this.isGroupOwner(params);
    // 将另一个人设置为群主
    await this.setGroupMemberIdentity({
      userId: params.userId,
      roomId: params.roomId,
      beSetId: params.beOwnerId,
      userType: 'owner',
    });

    // 将自己设置为群成员
    return await this.setGroupMemberIdentity({
      userId: params.beOwnerId,
      roomId: params.roomId,
      beSetId: params.userId,
      userType: 'member',
    });
  }

  // 获取会话列表
  getSessionList() {}
}
