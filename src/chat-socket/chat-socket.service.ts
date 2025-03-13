import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ConnectedServer, JoinRoom } from './dto/create-chat-socket.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from './entities/chat-room-entity';
import { UserRoomShip } from './entities/user-room-ship.entity';
import { Repository } from 'typeorm';
import { SingleChatMsg } from './entities/single-chat-msg-entity';
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

  online(client: Socket, userId: string) {
    userToClient[userId] = client;
    clientToUser[client.id] = userId;
    // 存储用户id和client的配对关系
    // 找出用户所在的群聊，将用户加入所有的群聊
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

  async storeSingleMessage(
    userId: string,
    roomId: string,
    receiverId: string,
    msg: any,
  ) {
    // messageList.push(msg);
    // find roomId
    // save room message
    await this.singleChatMsgRepository.save({
      roomId,
      senderId: userId,
      receiverId,
      content: msg,
    });
    return true;
  }

  // storeGroupMessage(userId: string, roomId: string, msg: any) {}

  sendMessage(client: Socket, userId: string, receiverId: string, msg: any) {
    client.to(receiverId).emit('message', msg);
    this.sendMessage(client, userId, receiverId, msg);
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
