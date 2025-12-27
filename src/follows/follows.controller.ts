import { Controller, Post, Delete, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FollowsService } from './follows.service';

@Controller('follows')
export class FollowsController {
    constructor(private readonly followsService: FollowsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id')
    async follow(@Request() req, @Param('id') followingId: string) {
        return this.followsService.followUser(req.user.id, parseInt(followingId, 10));
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    async unfollow(@Request() req, @Param('id') followingId: string) {
        return this.followsService.unfollowUser(req.user.id, parseInt(followingId, 10));
    }

    @Get('search')
    async search(@Query('q') query: string) {
        return this.followsService.searchUsers(query);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my/followers')
    async getMyFollowers(@Request() req) {
        return this.followsService.getFollowers(req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my/following')
    async getMyFollowing(@Request() req) {
        return this.followsService.getFollowing(req.user.id);
    }
}
