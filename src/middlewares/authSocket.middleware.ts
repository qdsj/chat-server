import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { SocketAuthGuard } from 'src/guards/socket.auth';

export function WsAuthMiddleware(
  jwtService: JwtService,
  callback: (client: Socket) => void,
) {
  return (socket: Socket, next: (err?: Error) => void) => {
    try {
      socket.data.user = SocketAuthGuard.validateToken(socket, jwtService);
      callback(socket);
      next();
    } catch (error) {
      console.log('认证失败', error);
      // socket.close();
      next(new Error('认证失败'));
    }
  };
}
