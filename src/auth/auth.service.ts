import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    private async migrateVotes(user: User, deviceUuid: string) {
        // Update all votes formatted with this deviceUuid to belong to the new user
        await this.votesRepository.update(
            { user_uuid: deviceUuid },
            { user: user }
        );
    }

    async verifyGeoLocation(userId: number, lat: number, lon: number) {
        // Mock Geo-Verification for MVP
        // In real app, call Nominatim API here.

        // Mock: If lat/lon provided, verify as "Gangnam-gu" for testing
        const region = "Gangnam-gu"; // Placeholder

        await this.usersRepository.update(userId, { verified_region: region });
        return { verified_region: region };
    }
}
