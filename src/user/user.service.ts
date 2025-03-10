import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  findUserByNameOrEmail(id: string) {
    return {
      id,
      username: 'test',
    };
  }
}
