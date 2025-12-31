import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async updateNickname(userId: number, newNickname: string) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Check if nickname is actually changing
        if (user.nickname === newNickname) {
            return user;
        }

        // Check 90-day restriction
        if (user.last_nickname_update) {
            const now = new Date();
            const lastUpdate = new Date(user.last_nickname_update);
            const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 90) {
                const daysRemaining = 90 - diffDays;
                throw new BadRequestException(`닉네임은 90일에 한 번만 변경할 수 있습니다. (${daysRemaining}일 남음)`);
            }
        }

        // Update nickname
        user.nickname = newNickname;
        user.last_nickname_update = new Date(); // Update timestamp

        return await this.usersRepository.save(user);
    }
}
