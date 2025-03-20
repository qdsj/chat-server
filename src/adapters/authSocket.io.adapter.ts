import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Socket } from 'socket.io';

@Injectable()
export class AuthSocketIoAdapter extends IoAdapter {
  private secret: string;
  constructor(app: any, secret: string) {
    super(app);
    this.secret = secret;
  }
  createIOServer(port: number, options?: any): any {
    console.log('createIOServer', port, options);
    const server = super.createIOServer(port, options);
    server.use(async (socket: Socket, next) => {
      const token = socket.handshake.headers.authorization?.split(' ')[1];
      try {
        // 调用验证逻辑（如 JWT 验证）
        const jwtService = new JwtService({ secret: this.secret });
        const user = jwtService.verifyAsync(token); // 实现你的验证服务
        socket.data.user = user; // 将用户信息存储到 socket.data
        next();
      } catch {
        next(new Error('认证失败'));
      }
    });
    return server;
  }
}
