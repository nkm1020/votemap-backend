// src/votes/vote.entity.ts

import { Topic } from '../topics/topic.entity';
import { User } from '../users/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  choice: string; // 'A' 또는 'B'를 저장합니다.

  @Column()
  region: string;

  @Column({ nullable: true }) // 기존 데이터 호환을 위해 nulalble 허용, 추후 필수값으로 변경
  user_uuid: string;

  @CreateDateColumn() // 투표 시 자동으로 시간이 기록됩니다.
  voted_at: Date;

  @ManyToOne(() => Topic) // Topic과 관계를 맺습니다. (하나의 주제는 여러 투표를 가짐)
  topic: Topic;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}