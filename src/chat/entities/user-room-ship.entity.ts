import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type RoomShipType = 'pending' | 'accepted' | 'rejected' | 'blocked';

export type RoomUserType = 'user' | 'owner' | 'admin' | 'member';
@Entity('user_room_ship')
export class UserRoomShip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
  })
  roomId: string;

  @Column({
    type: 'uuid',
  })
  userId: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'accepted',
  })
  status: RoomShipType;

  // 普通用户/群主/管理员/群成员
  @Column({
    type: 'enum',
    enum: ['user', 'owner', 'admin', 'member'],
    default: 'user',
  })
  userType: RoomUserType;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;
}
