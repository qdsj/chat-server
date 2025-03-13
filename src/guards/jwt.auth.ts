import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    // 获取自己的令牌
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      return true;
    }

    try {
      console.log('Validating JWT token...');
      const payload = this.jwtService.verify(token);
      request['user'] = payload;
      request['skip-cookie-guard'] = true;
    } catch {
      console.log('Invalid JWT token');
    } finally {
      return true;
    }

    // this.jwtService = new JwtService();
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
