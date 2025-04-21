import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('SessionList')
export class Session {
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
    type: 'enum',
    enum: ['person', 'group'],
    default: 'person',
  })
  type: 'person' | 'group';

  @Column({
    type: 'boolean',
    default: false,
  })
  isDeleted: boolean;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;
}
