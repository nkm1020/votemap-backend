import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
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

    // TODO: Add Bearer Guard to extract user_id automatically
    @Post('geo-verify')
    async geoVerify(@Body() body: GeoVerifyDto) {
        return this.authService.verifyGeoLocation(body.user_id, body.latitude, body.longitude);
    }
}
