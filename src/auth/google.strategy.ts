import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private authService: AuthService,
    ) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || '270663046112-js0hiuk9eh3ouoe5ar587foqpeq6nphk.apps.googleusercontent.com',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, name, emails, photos, provider } = profile;

        // Use AuthService to find or create the user in our DB
        const user = await this.authService.validateSocialUser({
            socialId: id,
            provider: provider,
            email: emails[0].value,
            nickname: name.displayName || name.givenName,
            profileImage: photos[0].value,
        });

        // user returned here is the Entity (checked in auth.service.ts), so it has an 'id'
        done(null, user);
    }
}
