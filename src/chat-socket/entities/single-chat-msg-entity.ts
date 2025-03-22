import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type MsgType = 'text' | 'image' | 'video' | 'audio';

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
  })
  msgType: MsgType;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;
}
