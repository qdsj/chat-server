import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { OssService } from './oss.service';
import { AuthServerAuthGuard } from 'src/guards/authService.auth';
import { JwtAuthGuard } from 'src/guards/jwt.auth';

@UseGuards(JwtAuthGuard, AuthServerAuthGuard)
@Controller('oss')
export class OssController {
  constructor(private readonly ossService: OssService) {}

  @Get()
  oss() {
    return {
      data: 'oss',
    };
  }

  @Get('getTempSignature')
  async getTempSignature() {
    try {
      const params = await this.ossService.getTempSignature();
      return {
        status: HttpStatus.OK,
        message: 'success',
        data: params,
      };
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
        data: null,
      };
    }
  }
}
