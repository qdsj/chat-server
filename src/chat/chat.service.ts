import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
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
    }

    return await this.openWindowTimeRepository.save(windowTime);
  }

  // 获取一个聊天窗口列表
  async getChatWindowListByRoomId(params: { user: User; roomId: string }) {
    return this.openWindowTimeRepository.find({
      where: { userId: params.user.id, roomId: params.roomId },
    });
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
    return res.map((item) => {
      item.roomId = friendId;
      (item as any).type = 'person';
      return item;
    });
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
    return res.map((item) => {
      (item as any).type = 'group';
      return item;
    });
  }

  // 保存单聊消息
  async saveSingleMessage(params: Omit<SingleChatMsg, 'id' | 'createdAt'>) {
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
        avatar: '',
        type: 'group',
      },
    ]);

    console.log('chatRoom', chatRoom);

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
    userId: string;
    roomId: string;
    status: RoomShipType;
    userType: RoomUserType;
  }) {
    await this.userRoomShipRepository.save([
      {
        userId: params.userId,
        roomId: params.roomId,
        type: 'group',
        status: params.status || 'pending',
        userType: params.userType || 'member',
      },
    ]);
  }

  // 同意加入群聊
  async agreeJoinGroup(params: { userId: string; roomId: string }) {
    // 找到群关系 rowData
    const rowData = await this.userRoomShipRepository.findOneBy({
      roomId: params.roomId,
      userId: params.userId,
    });

    if (!rowData) {
      throw new HttpException('未被邀请加入该群', HttpStatus.BAD_REQUEST);
    }

    // 将群关系设置为 accepted
    rowData.status = 'accepted';
    await this.userRoomShipRepository.save(rowData);
    return true;
  }

  // 拒绝加入群聊
  async rejectJoinGroup(params: { userId: string; roomId: string }) {
    // 找到群关系 rowData
    const rowData = await this.userRoomShipRepository.findOneBy({
      roomId: params.roomId,
      userId: params.userId,
    });

    if (!rowData) {
      throw new HttpException('未被邀请加入该群', HttpStatus.BAD_REQUEST);
    }

    // 将群关系设置为 rejected
    rowData.status = 'rejected';
    await this.userRoomShipRepository.save(rowData);
    return true;
  }

  // 踢出群聊
  async kickGroupMember(params: {
    userId: string;
    beBlockerId: string;
    roomId: string;
  }) {
    // 找到被踢出群聊的人群关系 rowData
    const rowData1 = await this.userRoomShipRepository.findOneBy({
      roomId: params.roomId,
      userId: params.beBlockerId,
    });

    if (!rowData1) {
      throw new HttpException('未被邀请加入该群', HttpStatus.BAD_REQUEST);
    }

    // 找到踢出群聊的人群关系 rowData
    const isHasAuth = await this.isGroupOwnerOrAdmin({
      roomId: params.roomId,
      userId: params.userId,
    });
    if (!isHasAuth) throw new HttpException('没有权限', HttpStatus.BAD_REQUEST);

    // 将群关系设置为 rejected
    rowData1.status = 'blocked';
    await this.userRoomShipRepository.save(rowData1);
    return true;
  }

  // 是否可以继续免同意拉人
  async canJoinGroup(params: { userId: string; roomId: string }) {
    const count = await this.getGroupMembersCount(params.roomId);
    if (count > 3) return false;
    return true;
  }

  // 获取群成员的信息
  async getGroupMembersInfo(roomId: string) {
    const res = await this.chatRoomRepository.find({ where: { id: roomId } });

    if (!res) throw new HttpException('群聊不存在', HttpStatus.BAD_REQUEST);

    return this.userRoomShipRepository.find({
      where: { roomId },
    });
  }

  // 获取群成员的数量
  async getGroupMembersCount(roomId: string) {
    const res = await this.userRoomShipRepository.find({ where: { roomId } });

    if (!res) throw new HttpException('群聊不存在', HttpStatus.BAD_REQUEST);

    return this.userRoomShipRepository.countBy({ roomId });
  }

  // 获取群聊基本信息
  async getGroupInfo(roomId: string) {
    const res = await this.chatRoomRepository.findOne({
      where: { id: roomId },
    });

    if (!res) throw new HttpException('群聊不存在', HttpStatus.BAD_REQUEST);

    return res;
  }

  // 检查群成员是否为管理员或群主
  async isGroupOwnerOrAdmin(params: { userId: string; roomId: string }) {
    const rowData = await this.userRoomShipRepository.findOneBy({
      roomId: params.roomId,
      userId: params.userId,
    });

    console.log('rowData', rowData);
    if (!rowData) {
      throw new HttpException('不在该群内', HttpStatus.BAD_REQUEST);
    } else if (rowData.userType !== 'admin' && rowData.userType !== 'owner') {
      return false;
    }

    return true;
  }

  // 检查群成员是否为群主
  async isGroupOwner(params: { userId: string; roomId: string }) {
    const rowData = await this.userRoomShipRepository.findOneBy({
      roomId: params.roomId,
      userId: params.userId,
    });

    if (!rowData) {
      throw new HttpException('不在该群内', HttpStatus.BAD_REQUEST);
    } else if (rowData.userType !== 'owner') {
      return false;
    }

    return true;
  }

  // 修改群聊信息
  async updateGroupInfo(params: ChatRoomInfo & { userId: string }) {
    const isHasAuth = await this.isGroupOwnerOrAdmin({
      userId: params.userId,
      roomId: params.roomId,
    });
    if (!isHasAuth) throw new HttpException('没有权限', HttpStatus.BAD_REQUEST);
    const roomId = params.roomId;

    const chatRoomInfo = this.chatRoomRepository.findOneBy({ id: roomId });
    if (!chatRoomInfo)
      throw new HttpException('群聊不存在', HttpStatus.BAD_REQUEST);
    delete params.userId;
    delete params.roomId;
    if ('id' in params) {
      delete params.id;
    }
    return await this.chatRoomRepository.update(roomId, { ...params });
  }

  // 解散群聊
  async dismissGroup(params: { userId: string; roomId: string }) {
    const isHasAuth = await this.isGroupOwnerOrAdmin({
      userId: params.userId,
      roomId: params.roomId,
    });
    if (!isHasAuth) throw new HttpException('没有权限', HttpStatus.BAD_REQUEST);
    const chatRoom = await this.chatRoomRepository.findOneBy({
      id: params.roomId,
    });
    if (!chatRoom)
      throw new HttpException('群聊不存在', HttpStatus.BAD_REQUEST);
    chatRoom.deleted = true;
    this.chatRoomRepository.save(chatRoom);
  }

  // 添加群消息
  async saveGroupMessage(params: Omit<SingleChatMsg, 'id' | 'createdAt'>) {
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
  async getGroupList(userId: string) {
    const res = await this.userRoomShipRepository.find({ where: { userId } });
    return Promise.all(
      res.map(async (item) => {
        try {
          const info = await this.getGroupInfo(item.roomId);
          if (info?.type === 'group') {
            (info as any).roomShip = item;
            return info;
          }
        } catch {
          return false;
        }
      }),
    ).then((res) => res.filter(Boolean));
  }
}
