import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatService } from 'src/chat/chat.service';
import { generateRoomId } from 'src/util';
import { Repository } from 'typeorm';
import { ChatRoom } from '../chat/entities/chat-room-entity';
import {
  MsgType,
  SingleChatMsg,
} from '../chat/entities/single-chat-msg-entity';
import { UserRoomShip } from '../chat/entities/user-room-ship.entity';
import {
  ConnectedServer,
  JoinRoom,
  SendPayloadToClient,
} from './dto/create-chat-socket.dto';
const userToClient = {};
const clientToUser = {};
const onlineSocket = new Map();
const roomMap = new Map();

@Injectable()
export class ChatSocketService {
  @InjectRepository(ChatRoom)
  private chatRoomRepository: Repository<ChatRoom>;

  @InjectRepository(UserRoomShip)
  private userRoomShipRepository: Repository<UserRoomShip>;

  @InjectRepository(SingleChatMsg)
  private singleChatMsgRepository: Repository<SingleChatMsg>;

  @Inject(ChatService)
  private chatService: ChatService;

  async online(client: Socket, userId: string) {
    userToClient[userId] = client;
    clientToUser[client.id] = userId;
    // 存储用户id和client的配对关系
    // 找出用户所在的群聊，将用户加入所有的群聊
    const groupList = await this.chatService.getGroupList(userId);
    groupList.forEach((item) => {
      client.join(item.id);
    });
    // 将群聊内的，在用户打开窗口之后的消息，全部发送给用户

    // 用户发送单聊信息，将信息发送给对方的房间，并将消息放到数据库中
    // 新增两个数据库，一个是单聊信息表，一个打开窗口的时间
    // 用户发送群聊信息，将信息发送给群聊的房间，并将消息放到数据库中
    // 新增一个数据库，群聊信息表，群聊关系表，表示用户在群聊内
    // 群聊表，记录群聊的信息
  }

  connect(client: Socket, createDto: ConnectedServer) {
    if (onlineSocket.get(client.id)) {
      onlineSocket.set(client.id, {
        ...onlineSocket.get(client.id),
        ...createDto,
      });
    }

    return {
      code: 200,
      msg: '连接成功',
    };
  }

  // 存储单聊信息
  async storeSingleMessage(
    userId: string,
    receiverId: string,
    msg: any,
    msgType: MsgType,
  ) {
    return this.chatService.saveSingleMessage({
      roomId: generateRoomId(userId, receiverId),
      senderId: userId,
      receiverId,
      content: msg,
      msgType,
    });
  }

  // 存储群聊信息

  // storeGroupMessage(userId: string, roomId: string, msg: any) {}
  getClientIdByUserId(userId: string) {
    return userToClient[userId]?.id;
  }
  async sendMessage(params: {
    client: Socket;
    userId: string;
    receiverId: string;
    msg: any;
    msgType: MsgType;
  }) {
    const { client, userId, receiverId, msg, msgType } = params;
    const roomId = generateRoomId(userId, receiverId);
    const message: SendPayloadToClient = {
      msg,
      senderId: userId,
      roomId,
      msgType,
      type: 'person',
    };

    // send to receiver
    const clientId = this.getClientIdByUserId(receiverId);
    if (clientId) {
      // throw new Error('请尝试重新登陆');
      client.to(clientId).emit('message', { ...message, roomId: userId });
    } else {
      console.log('发送者没有登陆');
    }
    // send to client
    client.emit('message', { ...message, roomId: receiverId });
    await this.storeSingleMessage(userId, receiverId, msg, msgType);
  }

  async sendGroupMessage(params: {
    message: {
      senderId: string;
      roomId: string;
      msg: any;
      msgType: MsgType;
    };
    client: Socket;
  }) {
    const { message } = params;
    try {
      await this.chatService.getGroupInfo(message.roomId);

      // send to all user in group
      params.client.to(message.roomId).emit('message', {
        ...message,
        type: 'group',
      });

      params.client.emit('message', {
        ...message,
        type: 'group',
      });

      this.chatService.saveGroupMessage({
        roomId: message.roomId,
        senderId: message.senderId,
        content: message.msg,
        msgType: message.msgType,
        atPersonId: '',
      });
    } catch (error) {
      params.client.emit('message', error);
    }
  }

  joinRoom(client: Socket, data: JoinRoom) {
    if (roomMap.has(data.roomId)) {
      roomMap.get(data.roomId).push(client.id);
    } else if (data.roomId) {
      roomMap.set(data.roomId, [client.id]);
    }
  }

  findAllOnline() {
    return [...onlineSocket.values()];
  }

  findOne(id: number) {
    return `This action returns a #${id} chatSocket`;
  }

  remove(id: number) {
    return `This action removes a #${id} chatSocket`;
  }
}
