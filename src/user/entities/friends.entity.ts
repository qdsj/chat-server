import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type FriendShipType = 'pending' | 'accepted' | 'rejected' | 'blocked';

@Entity('friends')
export class Friends {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    nullable: true,
    default: '',
  })
  requesterId: string;
  @Column({
    type: 'uuid',
    nullable: false,
  })
  receiverId: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  requestMessage: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending',
    nullable: false,
  })
  status: FriendShipType;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  blockerId: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;
}
