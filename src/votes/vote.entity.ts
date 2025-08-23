// src/votes/vote.entity.ts

import { Topic } from '../topics/topic.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

@Entity()
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  choice: string; // 'A' 또는 'B'를 저장합니다.

  @Column()
  region: string;

  @CreateDateColumn() // 투표 시 자동으로 시간이 기록됩니다.
  voted_at: Date;

  @ManyToOne(() => Topic) // Topic과 관계를 맺습니다. (하나의 주제는 여러 투표를 가짐)
  topic: Topic;
}