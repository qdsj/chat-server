import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type MsgType = 'text' | 'image' | 'video' | 'audio' | 'server'; //系统消息

export enum ServerMsgTypeEnum {
  'request-friend' = 'request-friend',
  'agree-friend' = 'agree-friend',
  'enter-group' = 'enter-group',
  'be-enter-group' = 'be-enter-group',
  'be-blocked-group' = 'be-blocked-group',
  'new-message' = 'new-message',
}

export type ServerMsgType = keyof typeof ServerMsgTypeEnum;

@Entity('single_chat_msg')
export class SingleChatMsg {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  roomId: string;

  @Column({
    type: 'uuid',
  })
  senderId: string;

  @Column({
    type: 'uuid',
  })
  receiverId: string;

  @Column({
    type: 'text',
  })
  content: string;

  @Column({
    type: 'varchar',
    length: 255,
    default: 'text',
  })
  msgType: MsgType;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;
}
