import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Follow } from './follow.entity';
import { User } from '../users/user.entity';

@Injectable()
export class FollowsService {
    constructor(
        @InjectRepository(Follow)
        private followsRepository: Repository<Follow>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async followUser(followerId: number, followingId: number) {
        if (followerId === followingId) {
            throw new BadRequestException('You cannot follow yourself');
        }

        const exactFollow = await this.followsRepository.findOne({
            where: {
                follower: { id: followerId },
                following: { id: followingId }
            }
        });

        if (exactFollow) {
            return { message: 'Already following' };
        }

        const newFollow = this.followsRepository.create({
            follower: { id: followerId },
            following: { id: followingId }
        });

        await this.followsRepository.save(newFollow);
        return { message: 'Followed successfully' };
    }

    async unfollowUser(followerId: number, followingId: number) {
        const follow = await this.followsRepository.findOne({
            where: {
                follower: { id: followerId },
                following: { id: followingId }
            }
        });

        if (follow) {
            await this.followsRepository.remove(follow);
        }
        return { message: 'Unfollowed successfully' };
    }

    async getFollowers(userId: number) {
        return this.followsRepository.find({
            where: { following: { id: userId } },
            relations: ['follower']
        });
    }

    async getFollowing(userId: number) {
        return this.followsRepository.find({
            where: { follower: { id: userId } },
            relations: ['following']
        });
    }

    async searchUsers(query: string) {
        if (!query) return [];
        return this.usersRepository.find({
            where: [
                { nickname: Like(`%${query}%`) },
                { email: Like(`%${query}%`) }
            ],
            take: 10,
            select: ['id', 'nickname', 'profile_image', 'bio', 'valified_region'] as any
            // Note: typo in user entity might be 'verified_region', check User entity
        });
    }
}
