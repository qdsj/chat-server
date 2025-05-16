import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type MsgType = 'text' | 'image' | 'video' | 'audio' | 'server';

@Entity('group_chat_msg')
export class GroupChatMsg {
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
    nullable: true,
  })
  atPersonId: string;

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
