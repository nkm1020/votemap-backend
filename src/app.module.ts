import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from './topics/topic.entity';
import { Vote } from './votes/vote.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', // 대부분 기본값이 'postgres'입니다.
      password: 'admin', // 파트너님께서 설치 시 설정한 DB 비밀번호를 여기에 입력!
      database: 'postgres', // 일단 기본 DB에 연결합니다.
      entities: [Topic, Vote],
      synchronize: true, // 개발용 옵션: 코드가 바뀌면 DB 테이블을 자동으로 맞춰줍니다.
    }),
    TypeOrmModule.forFeature([Topic, Vote]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
