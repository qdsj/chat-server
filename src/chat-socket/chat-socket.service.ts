import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { ChatService } from 'src/chat/chat.service';
import { UserService } from 'src/user/user.service';
import { generateRoomId } from 'src/util';
import {
  MsgType,
  ServerMsgType,
  ServerMsgTypeEnum,
} from '../chat/entities/single-chat-msg-entity';
import {
  ConnectedServer,
  JoinRoom,
  SendPayloadToClient,
} from './dto/create-chat-socket.dto';
import { WebSocketServer } from '@nestjs/websockets';
const userToClient = {};
const clientToUser = {};
const onlineSocket = new Map();
const roomMap = new Map();

@Injectable()
export class ChatSocketService {
  @Inject(ChatService)
  private chatService: ChatService;

  @Inject(UserService)
  private userService: UserService;

  @WebSocketServer()
  private server: Server;

  async online(client: Socket, userId: string) {
    userToClient[userId] = client;
    clientToUser[client.id] = userId;
    // 存储用户id和client的配对关系
    // 找出用户所在的群聊，将用户加入所有的群聊
    const groupList = await this.chatService.getGroupList(userId);
    groupList.forEach((item) => {
      client.join(item.id);
    });
    // 告诉自己所有的好友，我上线了，这个消息不用存储在数据库中

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
      createdAt: new Date(),
    });
  }

  // 存储群聊信息
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
    console.log('this.server: ', this.server);
    // check is friend
    await this.userService.isFriendShip(
      params.userId,
      params.receiverId,
      'accepted',
    );

    const { userId, receiverId, msg, msgType } = params;
    // const roomId = generateRoomId(userId, receiverId);
    const message = {
      msg,
      senderId: userId,
      msgType,
      type: 'person',
    } as SendPayloadToClient;

    await this.storeSingleMessage(userId, receiverId, msg, msgType);

    this.sendMessageToUser({
      userId: params.userId,
      message: { ...message, roomId: receiverId },
    });
    this.sendMessageToUser({
      userId: receiverId,
      message: { ...message, roomId: userId },
    });

    const userInfo = await this.userService.findUserById(userId);
    this.sendServerMessage({
      receiverId: receiverId,
      message: JSON.stringify({
        title: `你有一条来自${userInfo.username}的消息`,
        content: msg,
      }),
      msgType: ServerMsgTypeEnum['new-message'],
    });
  }

  async sendMessageToUser(params: {
    userId: string;
    message: { roomId: string; msgType: MsgType | ServerMsgType };
  }) {
    const { userId, message } = params;
    const client = userToClient[userId];
    console.log('client', userId, message, clientToUser);
    if (client) {
      console.log('用户在线', userId);
      client.emit('message', message);
    }
  }

  @OnEvent('socket.sendMessageFakeUser')
  async sendMessageFakeUser(params: {
    senderId: string;
    receiverId: string;
    type: 'person' | 'group';
    message: any;
    msgType: MsgType;
  }) {
    const { message, type, senderId, receiverId, msgType } = params;
    const messageObj = {
      msg: message,
      senderId: params.senderId,
      roomId:
        type === 'person'
          ? generateRoomId(params.senderId, params.receiverId)
          : params.receiverId,
      msgType: params.msgType,
      type: params.type,
    };

    // store message
    if (type === 'person') {
      await this.storeSingleMessage(
        senderId,
        receiverId,
        message,
        msgType as MsgType,
      );
      // send message to person
      // messageObj.roomId = generateRoomId(senderId, receiverId);
      this.sendMessageToUser({
        userId: senderId,
        message: { ...messageObj, roomId: receiverId },
      });
      this.sendMessageToUser({
        userId: receiverId,
        message: { ...messageObj, roomId: senderId },
      });
    } else {
      await this.storeGroupMessage({
        senderId,
        roomId: messageObj.roomId,
        msg: message,
        msgType: msgType as MsgType,
      });

      // 发送群消息
      const client = userToClient[senderId];
      if (!client) return;
      client.to(messageObj.roomId).emit('message', messageObj);
    }
  }

  @OnEvent('socket.sendServerMessage')
  async sendServerMessage(params: {
    receiverId: string;
    message: any;
    msgType: ServerMsgType;
  }) {
    const { message, receiverId: senderId, msgType } = params;
    const messageObj = {
      senderId: '',
      roomId: '',
      msg: message,
      msgType: msgType,
      type: 'server',
    };
    this.sendMessageToUser({ userId: senderId, message: messageObj });
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

    await this.chatService.findChatRoomById({
      id: message.roomId,
    });

    // send to all user in group
    params.client.to(message.roomId).emit('message', {
      ...message,
      type: 'group',
    });

    params.client.emit('message', {
      ...message,
      type: 'group',
    });

    await this.storeGroupMessage(message);
  }

  storeGroupMessage(params: {
    roomId: string;
    senderId: string;
    msg: string;
    msgType: MsgType;
  }) {
    return this.chatService.saveGroupMessage({
      roomId: params.roomId,
      senderId: params.senderId,
      content: params.msg,
      msgType: params.msgType,
      atPersonId: '',
      createdAt: new Date(),
    });
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

type MethodParams<T> = T extends (...args: infer P) => any ? P : never;

type ChatSocketServiceMethods = {
  [K in keyof ChatSocketService]: MethodParams<ChatSocketService[K]>;
};

export type ChatSocketServiceMethodParams = ChatSocketServiceMethods;
