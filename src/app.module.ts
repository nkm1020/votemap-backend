import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from './topics/topic.entity';
import { Vote } from './votes/vote.entity';
import { VoteGateway } from './gateway/vote.gateway';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'postgres',
      entities: [Topic, Vote],
      synchronize: true, // 프로덕션에서도 테이블 자동 생성 (임시)
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),
    TypeOrmModule.forFeature([Topic, Vote]),
  ],
  controllers: [AppController],
  providers: [AppService, VoteGateway],
})
export class AppModule {}
