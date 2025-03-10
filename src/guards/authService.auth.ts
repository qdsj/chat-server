import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';

@Injectable()
export class AuthServerAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    // 是否跳过
    if (request['skip-cookie-guard']) {
      return true;
    }
    // 获取请求头中的auth-token 中间人的令牌
    const authToken = this.extractTokenFromHeader(request);
    let res;
    if (authToken) {
      try {
        // 与auth service进行校验，验证auth-token的正确性
        // 和中间人进行通信，验证令牌的正确性，有效性
        res = await this.authService.send('isLogin', authToken).toPromise();
        if (res && res.isLogin) {
          // 验证通过，颁发新的token
          request['user'] = res;
          const payload = {
            username: res.username,
            id: res.id,
          };
          console.log('payload: ', payload);
          const newToken = this.jwtService.sign(payload);
          response.setHeader('token', newToken);
          return true;
        }
      } catch (error) {
        console.log('auth service error: ', error);
        // 一旦守卫返回false，意味着身份验证失败，前端会收到403的反馈
        return false;
      }
    }
    console.log('auth token is null');
    const redirectUrl =
      res?.redirect ||
      (await this.authService.send('getRedirectUrl', '').toPromise());

    console.log('redirectUrl: ', redirectUrl, res);
    // 验证失败，返回403，指定登录页面，让前端打开新的登录页面
    response.setHeader('redirect', redirectUrl);
    return false;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] =
      (request.headers.authtoken as string)?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
