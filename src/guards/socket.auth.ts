import { CanActivate, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class SocketAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  canActivate(context) {
    console.log('SocketAuthGuard');
    const client = context.switchToWs().getClient();

    try {
      const payload = SocketAuthGuard.validateToken(client, this.jwtService);
      console.log('Socket token payload', payload);
      client.data['user'] = payload;
      return true;
    } catch {
      console.log('Invalid socket token');
      return false;
    }
  }

  static extractTokenFromHeader(request: Socket): string | undefined {
    const [type, token] =
      request.handshake.auth.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  static validateToken(client: Socket, jwtService: JwtService) {
    const token = SocketAuthGuard.extractTokenFromHeader(client);
    return jwtService.verify(token);
  }
}
