import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { Request, response } from 'express';

export class AuthServerAuthGuard implements CanActivate {
  private readonly jwtService: JwtService;

  @Inject('AUTH_SERVICE')
  private readonly authService: ClientProxy;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // 是否跳过
    if (request['skip-cookie-guard']) {
      return true;
    }
    // 获取请求头中的auth-token
    const authToken = this.extractTokenFromHeader(request);
    let res;
    if (authToken) {
      try {
        // 与auth service进行校验，验证auth-token的正确性
        res = await this.authService.send('isLogin', authToken).toPromise();
        console.log('cookie res: ', res);
        if (res && res.isLogin) {
          // 验证通过，颁发新的token
          const newToken = this.jwtService.sign({ username: res.username });
          request['user'] = res;
          request.headers.token = newToken;
          return true;
        }
      } catch (error) {
        console.log('auth service error: ', error);
        return false;
      }
    }
    // 验证失败，返回401，指定登录页面，让前端打开新的登录页面
    response['redirect'] = res?.redirect || '';
    return false;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] =
      (request.headers.authtoken as string)?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
