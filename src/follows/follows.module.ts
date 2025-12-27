import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './follow.entity';
import { User } from '../users/user.entity';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Follow, User])],
    providers: [FollowsService],
    controllers: [FollowsController],
    exports: [FollowsService],
})
export class FollowsModule { }
