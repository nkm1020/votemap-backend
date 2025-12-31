import { Body, Controller, Patch, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Patch('nickname')
    @UseGuards(AuthGuard('jwt'))
    async updateNickname(@Request() req, @Body('nickname') nickname: string) {
        return this.usersService.updateNickname(req.user.id, nickname);
    }
}
