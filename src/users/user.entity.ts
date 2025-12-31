import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Vote } from '../votes/vote.entity';
import { Follow } from '../follows/follow.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    phone_number: string;

    @Column({ nullable: true })
    nickname: string;

    @Column({ nullable: true })
    social_id: string;

    @Column({ nullable: true })
    provider: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    profile_image: string;

    @Column({ nullable: true })
    verified_region: string;

    @CreateDateColumn()
    created_at: Date;

    @Column({ nullable: true })
    bio: string;

    @OneToMany(() => Vote, (vote) => vote.user)
    votes: Vote[];

    // Relations for Social Graph
    @OneToMany(() => Follow, follow => follow.follower)
    following: Follow[];

    @OneToMany(() => Follow, follow => follow.following)
    followers: Follow[];

    @Column({ nullable: true })
    last_nickname_update: Date;

    @Column({ default: false })
    is_phone_verified: boolean;
}
