import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketAuthGuard } from 'src/guards/socket.auth';
import { WsAuthMiddleware } from 'src/middlewares/authSocket.middleware';
import { ChatSocketService } from './chat-socket.service';
import {
  ConnectedServer,
  JoinRoom,
  SendPayload,
} from './dto/create-chat-socket.dto';

@WebSocketGateway(Number(process.env.SOCKET_PORT || 3210), {
  cors: {
    origin: '*',
  },
  allowRequest(req, fn) {
    fn(null, true);
  },
  // path: '/socket.io/', // 添加正确的路径
  transports: ['websocket', 'polling'], // 支持的传输方式
  path: '/server/chatweb/socket', // 默认命名空间
})
export class ChatSocketGateway {
  constructor(
    private readonly chatSocketService: ChatSocketService,
    private jwtService: JwtService,
  ) {}

  @WebSocketServer()
  private server: Server;

  afterInit(socket: Socket) {
    socket.use(
      WsAuthMiddleware(this.jwtService, (socket) => {
        console.log('连接成功', socket.id, socket.data);
        this.chatSocketService.online(socket, socket.data.user.id);
      }) as any,
    );
  }

  @SubscribeMessage('connect-server')
  create(
    @MessageBody() payload: ConnectedServer,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(client.id);
    return this.chatSocketService.connect(client, payload);
  }

  @UseGuards(SocketAuthGuard)
  @SubscribeMessage('join')
  joinRoom(
    @MessageBody() payload: JoinRoom,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(payload.roomId);
    return this.chatSocketService.joinRoom(client, payload);
  }

  @SubscribeMessage('findAllOnline')
  findAll() {
    return this.chatSocketService.findAllOnline();
  }

  @SubscribeMessage('send')
  async findOne(
    @MessageBody() payload: SendPayload,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('receive: ', payload);
    if (payload.type === 'person') {
      await this.chatSocketService.sendMessage({
        client,
        userId: client.data.user.id,
        receiverId: payload.roomId,
        msg: payload.msg || '',
        msgType: payload.msgType,
      });
      return 'success';
    }
    // this.server.to(payload.roomId).except(client.id).emit('message', payload); // 使用 server 进行广播
    // client.to(payload.roomId).emit('message', payload); // 使用 client 进行广播

    // 返回给发送方
    return 'not support type';
  }

  @SubscribeMessage('removeChatSocket')
  remove(@MessageBody() id: number) {
    return this.chatSocketService.remove(id);
  }
}
