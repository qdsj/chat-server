import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatSocketService } from './chat-socket.service';
import {
  ConnectedServer,
  JoinRoom,
  SendPayload,
} from './dto/create-chat-socket.dto';

@WebSocketGateway(3210, {
  cors: {
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    credentials: true,
  },
  // path: '/socket.io/', // 添加正确的路径
  transports: ['websocket', 'polling'], // 支持的传输方式
  namespace: '/', // 默认命名空间
})
export class ChatSocketGateway {
  constructor(private readonly chatSocketService: ChatSocketService) {}

  @WebSocketServer()
  private server: Server;

  handleConnection(socket: Socket) {
    console.log('连接成功', socket.id);
    this.chatSocketService.online(socket);
  }

  @SubscribeMessage('connect-server')
  create(
    @MessageBody() payload: ConnectedServer,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(client.id);
    return this.chatSocketService.connect(client, payload);
  }

  @SubscribeMessage('join')
  joinRoom(
    @MessageBody() payload: JoinRoom,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(payload.roomId);
    // this.server.joi
    return this.chatSocketService.joinRoom(client, payload);
  }

  @SubscribeMessage('findAllOnline')
  findAll() {
    return this.chatSocketService.findAllOnline();
  }

  @SubscribeMessage('send')
  findOne(
    @MessageBody() payload: SendPayload,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('receive: ', payload);
    this.server.to(payload.roomId).except(client.id).emit('message', payload); // 使用 server 进行广播
    // client.broadcast.to(payload.roomId).emit('message', payload);
    return 'success';
  }

  @SubscribeMessage('removeChatSocket')
  remove(@MessageBody() id: number) {
    return this.chatSocketService.remove(id);
  }
}
