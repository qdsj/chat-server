import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;
}
