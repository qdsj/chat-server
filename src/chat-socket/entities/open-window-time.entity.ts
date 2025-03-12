import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('open_window_time')
export class OpenWindowTime {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
  })
  userId: string;
  @Column({
    type: 'varchar',
    length: 255,
  })
  roomId: string;

  @Column({
    type: 'timestamp',
    nullable: false,
  })
  openTime: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createTime: Date;
}
