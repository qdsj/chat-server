import { Injectable } from '@nestjs/common';
import { User } from './dto/user.dto';
import { ChatRoom } from 'src/chat/entities/chat-room-entity';
import { UserRoomShip } from 'src/chat/entities/user-room-ship.entity';
import { Repository } from 'typeorm';
import { SingleChatMsg } from 'src/chat/entities/single-chat-msg-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { generateRoomId } from 'src/util';

@Injectable()
export class ChatService {
  @InjectRepository(ChatRoom)
  private chatRoomRepository: Repository<ChatRoom>;

  @InjectRepository(UserRoomShip)
  private userRoomShipRepository: Repository<UserRoomShip>;

  @InjectRepository(SingleChatMsg)
  private singleChatMsgRepository: Repository<SingleChatMsg>;
  async getSingleChatHistory(user: User, friendId: string) {
    const roomId = generateRoomId(user.id, friendId);

    const res = await this.singleChatMsgRepository.find({ where: { roomId } });
    return res.map((item) => {
      item.roomId = friendId;
      return item;
    });
  }

  async saveSingleMessage(params: Omit<SingleChatMsg, 'id' | 'createdAt'>) {
    try {
      await this.singleChatMsgRepository.save({ ...params, type: 'person' });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  createGroup() {
    // name, description, avatar
  }
}
