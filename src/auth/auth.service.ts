import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '../users/user.entity';
import { Vote } from '../votes/vote.entity';

@Injectable()
export class AuthService {
    // Mock SMS OTP Storage (In-Memory)
    private otpStorage = new Map<string, string>();

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Vote)
        private votesRepository: Repository<Vote>,
        private jwtService: JwtService,
    ) { }

    async validateSocialUser(details: { socialId: string, provider: string, email: string, nickname: string, profileImage: string }) {
        let user = await this.usersRepository.findOne({
            where: {
                social_id: details.socialId,
                provider: details.provider
            }
        });

        if (!user) {
            user = this.usersRepository.create({
                social_id: details.socialId,
                provider: details.provider,
                email: details.email,
                nickname: details.nickname,
                profile_image: details.profileImage,
                verified_region: 'N/A' // Default
            });
            await this.usersRepository.save(user);
        }
        return user;
    }

    async login(user: any) {
        const payload = { sub: user.id, username: user.nickname };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    verifyToken(token: string) {
        try {
            return this.jwtService.verify(token);
        } catch (e) {
            return null;
        }
    }

    async requestOtp(phoneNumber: string): Promise<{ message: string }> {
        // 1. Generate 6-digit code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Store in memory (Phone -> OTP)
        this.otpStorage.set(phoneNumber, otp);
        console.log(`[Mock SMS] OTP for ${phoneNumber}: ${otp}`); // Log for dev

        // 3. Set TTL of 3 minutes (Optional for prototype)
        setTimeout(() => {
            this.otpStorage.delete(phoneNumber);
        }, 3 * 60 * 1000);

        return { message: 'Authentication code sent' };
    }

    async verifyOtp(phoneNumber: string, code: string, deviceUuid?: string) {
        // 1. Verify Code
        const storedOtp = this.otpStorage.get(phoneNumber);
        if (!storedOtp || storedOtp !== code) {
            throw new UnauthorizedException('Invalid or expired authentication code');
        }

        // 2. Clear OTP
        this.otpStorage.delete(phoneNumber);

        // 3. Find or Create User
        let user = await this.usersRepository.findOne({ where: { phone_number: phoneNumber } });
        if (!user) {
            user = this.usersRepository.create({
                phone_number: phoneNumber,
                nickname: `User${Math.floor(Math.random() * 10000)}`, // Random nickname
            });
            await this.usersRepository.save(user);
        }

        // 4. Migrate Votes (if deviceUuid provided)
        if (deviceUuid) {
            await this.migrateVotes(user, deviceUuid);
        }

        // 5. Generate Token
        const payload = { sub: user.id, username: user.nickname };
        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id,
                nickname: user.nickname,
                phone_number: user.phone_number,
                verified_region: user.verified_region
            }
        };
    }

    // Made public for SyncController usage if needed
    async migrateVotes(user: User, deviceUuid: string) {
        // Update all votes formatted with this deviceUuid to belong to the new user
        // Only if they don't have a user assigned yet (optional check, but safer)
        await this.votesRepository.update(
            { user_uuid: deviceUuid, user: IsNull() },
            { user: user }
        );
    }

    private calculatePropensity(votes: Vote[]) {
        if (votes.length === 0) {
            return {
                match_rate: 0,
                title: 'Newcomer',
                description: '첫 투표를 기다리고 있습니다.',
            };
        }

        let matchCount = 0;
        // In a real app, 'majority' calculation should be optimized (e.g., cached results)
        // For now, we reuse the logic but we need access to results. 
        // Note: app.service has access to repositories. AuthService does too.
        // But re-calculating results for every vote here is expensive.
        // Simplified heuristic: random match rate for prototype or assume majority is stored?
        // Let's implement a simplified version or just assume 50% for now if complex.

        // Actually, let's just make it random-ish but deterministic based on ID for the prototype speed
        // OR better: Move getUserStats logic to AuthService and reuse it.
        // But getUserStats is in AppService.

        // Let's replicate simple logic:
        const matchRate = 50 + (votes.length % 50); // Mock dynamic rate

        let title = 'Citizen';
        let description = '평범한 시민입니다.';

        if (votes.length >= 50) {
            title = 'Opinion Leader';
            description = '여론을 주도하는 헤비 유저입니다.';
        } else if (matchRate >= 90 && votes.length >= 5) {
            title = 'Native';
            description = '이 지역의 토박이! 지역 여론과 완벽하게 일치합니다.';
        } else if (matchRate <= 20 && votes.length >= 5) {
            title = 'Rebel';
            description = '고독한 반란군. 남들과는 다른 길을 갑니다.';
        } else if (matchRate >= 60) {
            title = 'Trend Follower';
            description = '대세를 따르는 편입니다.';
        }

        return { match_rate: matchRate, title, description };
    }

    async getUserProfile(userId: number) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['votes', 'votes.topic', 'followers', 'following'],
            order: { votes: { voted_at: 'DESC' } }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Deduplicate votes: Keep only the latest vote per topic
        const uniqueVotesMap = new Map<number, Vote>();
        const allVotes = user.votes || [];

        for (const vote of allVotes) {
            if (vote.topic && !uniqueVotesMap.has(vote.topic.id)) {
                uniqueVotesMap.set(vote.topic.id, vote);
            }
        }

        // Use unique votes for all statistics to ensure accuracy
        const uniqueVotes = Array.from(uniqueVotesMap.values());
        const totalVotes = uniqueVotes.length; // Count unique topics voted

        // Comparisons using unique votes (limit to 5)
        const uniqueRecentVotes = uniqueVotes.slice(0, 5);
        const comparisons = await this.getComparisons(uniqueRecentVotes);

        // Calculate Statistics derived from visible comparisons for consistency
        const displayTotal = comparisons.length;
        const displayMatchCount = comparisons.filter(c => c.isMatch).length;
        const displayMatchRate = displayTotal > 0 ? Math.round((displayMatchCount / displayTotal) * 100) : 0;

        const propensity = this.assignPersona(displayMatchRate, totalVotes);
        const topTags = this.extractTopTags(uniqueVotes);

        const followersCount = user.followers ? user.followers.length : 0;
        const followingCount = user.following ? user.following.length : 0;

        const badges: any[] = [];
        if (totalVotes >= 5) badges.push({ id: 'vote_5', name: '5회 투표', icon: '🏅' });
        if (totalVotes >= 10) badges.push({ id: 'vote_10', name: '10회 투표', icon: '🏅' });
        if (totalVotes >= 30) badges.push({ id: 'vote_30', name: '30회 투표', icon: '🏅' });
        if (propensity.title === 'Native') badges.push({ id: 'native', name: '토박이', icon: '🏠' });

        return {
            ...user,
            stats: {
                totalVotes,
                ranking: `상위 ${Math.max(1, 100 - totalVotes)}%`, // Keeping simple for now
                match_rate: displayMatchRate, // Use rate from visible comparisons
                title: propensity.title,
                description: propensity.description,
                followersCount,
                followingCount,
                topTags: topTags
            },
            badges,
            recentVotes: await Promise.all(uniqueRecentVotes.map(async (vote) => {
                if (!vote.topic) return { ...vote, stats: { A: 0, B: 0, total: 0 }, localStats: { A: 0, B: 0, total: 0 } };

                // 1. Global Stats
                const stats = await this.votesRepository
                    .createQueryBuilder('vote')
                    .select('vote.choice', 'choice')
                    .addSelect('COUNT(vote.id)', 'count')
                    .where('vote.topic.id = :topicId', { topicId: vote.topic.id })
                    .groupBy('vote.choice')
                    .getRawMany();

                let aCount = 0;
                let bCount = 0;
                stats.forEach(s => {
                    if (s.choice === 'A') aCount = parseInt(s.count);
                    if (s.choice === 'B') bCount = parseInt(s.count);
                });

                // 2. Local Stats (Region specific)
                let localA = 0;
                let localB = 0;

                if (vote.region) {
                    const localStatsQuery = await this.votesRepository
                        .createQueryBuilder('vote')
                        .select('vote.choice', 'choice')
                        .addSelect('COUNT(vote.id)', 'count')
                        .where('vote.topic.id = :topicId', { topicId: vote.topic.id })
                        .andWhere('vote.region = :region', { region: vote.region })
                        .groupBy('vote.choice')
                        .getRawMany();

                    localStatsQuery.forEach(s => {
                        if (s.choice === 'A') localA = parseInt(s.count);
                        if (s.choice === 'B') localB = parseInt(s.count);
                    });
                }

                return {
                    ...vote,
                    stats: {
                        A: aCount,
                        B: bCount,
                        total: aCount + bCount
                    },
                    localStats: {
                        A: localA,
                        B: localB,
                        total: localA + localB
                    }
                };
            })),
            comparisons
        };
    }

    private async calculateMatchRate(votes: Vote[], userRegion: string) {
        if (!votes || votes.length === 0 || !userRegion || userRegion === 'N/A') {
            return { matchRate: 0, matchCount: 0 };
        }

        let matchCount = 0;
        let validVoteCount = 0;

        for (const vote of votes) {
            if (!vote.topic) continue;

            // TODO: In a high-traffic app, cache this "Region Winner"
            // Get majority vote for this topic in this region
            const stats = await this.votesRepository
                .createQueryBuilder('vote')
                .select('vote.choice', 'choice')
                .addSelect('COUNT(vote.id)', 'count')
                .where('vote.topic.id = :topicId', { topicId: vote.topic.id })
                .andWhere('vote.region = :region', { region: userRegion })
                .groupBy('vote.choice')
                .getRawMany();

            let aCount = 0;
            let bCount = 0;
            stats.forEach(s => {
                if (s.choice === 'A') aCount = parseInt(s.count);
                if (s.choice === 'B') bCount = parseInt(s.count);
            });

            // Determine winner
            let regionWinner = 'DRAW';
            if (aCount > bCount) regionWinner = 'A';
            if (bCount > aCount) regionWinner = 'B';

            // Compare with my vote
            if (regionWinner !== 'DRAW') {
                validVoteCount++;
                if (vote.choice === regionWinner) {
                    matchCount++;
                }
            }
        }

        const matchRate = validVoteCount > 0 ? Math.round((matchCount / validVoteCount) * 100) : 0;
        return { matchRate, matchCount };
    }

    private assignPersona(matchRate: number, totalVotes: number) {
        if (totalVotes < 3) {
            return { title: 'Newcomer', description: '아직 데이터를 모으고 있어요.' };
        }

        if (matchRate >= 90) {
            return { title: '이 구역의 토박이', description: '동네 여론과 완벽하게 일치합니다!' };
        } else if (matchRate >= 60) {
            return { title: 'Trend Follower', description: '대세를 따르는 편이시네요.' };
        } else if (matchRate >= 40) {
            return { title: '독자적인 철학가', description: '자신만의 주관이 뚜렷합니다.' };
        } else {
            return { title: '고독한 반란군', description: '동네 사람들과 취향이 정반대?!' };
        }
    }

    private extractTopTags(votes: Vote[]) {
        const tagCounts: Record<string, number> = {};

        votes.forEach(vote => {
            if (!vote.topic) return;

            let tagsStr = '';
            if (vote.choice === 'A') tagsStr = vote.topic.option_a_tags;
            if (vote.choice === 'B') tagsStr = vote.topic.option_b_tags;

            if (tagsStr) {
                const tags = tagsStr.split(',').map(t => t.trim());
                tags.forEach(tag => {
                    if (tag) {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    }
                });
            }
        });

        // Convert to array and sort
        const sortedTags = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([tag]) => tag);

        return sortedTags;
    }

    private async getComparisons(votes: Vote[]) {
        const comparisons: { category: string; myChoice: string; neighborChoice: string; isMatch: boolean; }[] = [];
        const recentVotes = votes.slice(0, 5); // Latest 5

        for (const vote of recentVotes) {
            if (!vote.topic) continue;

            const region = vote.region || '전국'; // Fallback if no region

            const stats = await this.votesRepository
                .createQueryBuilder('vote')
                .select('vote.choice', 'choice')
                .addSelect('COUNT(vote.id)', 'count')
                .where('vote.topic.id = :topicId', { topicId: vote.topic.id })
                .andWhere('vote.region = :region', { region: region })
                .groupBy('vote.choice')
                .getRawMany();

            let aCount = 0;
            let bCount = 0;
            stats.forEach(s => {
                if (s.choice === 'A') aCount = parseInt(s.count);
                if (s.choice === 'B') bCount = parseInt(s.count);
            });

            let neighborChoice = 'DRAW';
            if (aCount > bCount) neighborChoice = 'A';
            if (bCount > aCount) neighborChoice = 'B';

            const neighborChoiceText = neighborChoice === 'A' ? vote.topic.option_a : (neighborChoice === 'B' ? vote.topic.option_b : '동률');
            const myChoiceText = vote.choice === 'A' ? vote.topic.option_a : vote.topic.option_b;

            comparisons.push({
                category: vote.topic.title,
                myChoice: myChoiceText,
                neighborChoice: neighborChoiceText,
                isMatch: vote.choice === neighborChoice
            });
        }
        return comparisons;
    }

    async verifyGeoLocation(userId: number, lat: number, lon: number) {
        // Mock: If lat/lon provided, verify as "서울특별시 강남구" for testing valid region logic
        // We will default to something valid in our list for better UX testing
        const region = "서울특별시 강남구";

        await this.usersRepository.update(userId, { verified_region: region });
        return { verified_region: region };
    }
}
