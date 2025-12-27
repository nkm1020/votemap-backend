import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('follows')
export class Follow {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.following)
    @JoinColumn({ name: 'follower_id' })
    follower: User;

    @ManyToOne(() => User, user => user.followers)
    @JoinColumn({ name: 'following_id' })
    following: User;

    @CreateDateColumn()
    created_at: Date;
}
