import { Body, Controller, Post, UseGuards, Request, Get, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

export class RequestOtpDto {
    phone_number: string;
}

export class VerifyOtpDto {
    phone_number: string;
    code: string;
    device_uuid?: string;
}

export class GeoVerifyDto {
    user_id: number;
    latitude: number;
    longitude: number;
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('otp/request')
    async requestOtp(@Body() body: RequestOtpDto) {
        return this.authService.requestOtp(body.phone_number);
    }

    @Post('otp/verify')
    async verifyOtp(@Body() body: VerifyOtpDto) {
        return this.authService.verifyOtp(body.phone_number, body.code, body.device_uuid);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Request() req) { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Request() req, @Res() res) {
        const { access_token } = await this.authService.login(req.user);
        // Redirect to frontend with token
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        res.redirect(`${clientUrl}/login/success?token=${access_token}`);
    }

    // Using POST /auth/sync as requested (or /users/sync if preferred, keeping in Auth for now as per flow)
    @Post('sync')
    @UseGuards(AuthGuard('jwt'))
    async syncVotes(@Body() body: { device_uuid: string }, @Request() req) {
        // req.user is populated by JwtStrategy (needs to be implemented/ensured)
        // Assuming JwtStrategy populates req.user with user entity or id
        // We might need to fetch the full user if req.user only has id
        // For now, let's assume req.user is available or load it
        return this.authService.migrateVotes(req.user, body.device_uuid);
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async getProfile(@Request() req) {
        return this.authService.getUserProfile(req.user.id);
    }

    // TODO: Add Bearer Guard to extract user_id automatically
    @Post('geo-verify')
    async geoVerify(@Body() body: GeoVerifyDto) {
        return this.authService.verifyGeoLocation(body.user_id, body.latitude, body.longitude);
    }
}
