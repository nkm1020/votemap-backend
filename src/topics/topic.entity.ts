// src/topics/topic.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum TopicStatus {
  PREPARING = 'preparing',
  ONGOING = 'ongoing',
  CLOSED = 'closed',
}

@Entity()
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  option_a: string;

  @Column({ nullable: true })
  option_a_tags: string; // Comma separated tags e.g. "#미식가,#바삭함"

  @Column()
  option_b: string;

  @Column({ nullable: true })
  option_b_tags: string; // Comma separated tags e.g. "#융통성,#촉촉함"

  @Column({ nullable: true }) // 이미지는 없을 수도 있으므로 nullable
  image_url: string;

  @Column({
    type: 'enum',
    enum: TopicStatus,
    default: TopicStatus.PREPARING,
  })
  status: TopicStatus;

  // start_date, end_date 등은 MVP 이후 추가하겠습니다. (단순화)
}