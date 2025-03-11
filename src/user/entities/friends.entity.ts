import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('friends')
export class Friends {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  userId: string;
  @Column({
    type: 'uuid',
    nullable: false,
  })
  friendId: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending',
    nullable: false,
  })
  status: string;
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;
}
