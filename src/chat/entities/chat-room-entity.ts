import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chat_room')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default: '',
  })
  description: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default: '',
  })
  avatar: string;

  @Column({
    type: 'enum',
    enum: ['person', 'group'],
  })
  type: 'person' | 'group';

  @Column({
    type: 'boolean',
    nullable: true,
    default: false,
  })
  deleted: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;
}
