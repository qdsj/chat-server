import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ConnectedServer, JoinRoom } from './dto/create-chat-socket.dto';
const onlineSocket = new Map();
const roomMap = new Map();

const messageList = [];

@Injectable()
export class ChatSocketService {
  online(client: Socket) {
    onlineSocket.set(client.id, { client });
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

  storeMessage(msg: any) {
    messageList.push(msg);
    return true;
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
