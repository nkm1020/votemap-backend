// src/app.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic, TopicStatus } from './topics/topic.entity';
import { Vote } from './votes/vote.entity'; 
import { CreateVoteDto } from './votes/dto/create-vote.dto'; 
import { ResultsDto } from './results/results.dto';


@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
    @InjectRepository(Vote) // 추가: Vote Repository 주입
    private votesRepository: Repository<Vote>,
  ) {}

  // src/app.service.ts
  async getCurrentTopic(): Promise<Topic | null> { // 수정: '또는 null'을 추가하여 약속을 명확히 함
    return this.topicsRepository.findOne({ where: { status: TopicStatus.ONGOING } });
  }

  async createVote(createVoteDto: CreateVoteDto): Promise<Vote> {
    const newVote = this.votesRepository.create({
      choice: createVoteDto.choice,
      region: createVoteDto.region,
      topic: { id: createVoteDto.topic_id }, // 관계된 topic의 id를 넣어줍니다.
    });

    return this.votesRepository.save(newVote);
  }

   async getTopicResults(topicId: number): Promise<ResultsDto> {
    // 1. 데이터베이스에서 topicId에 해당하는 투표들을 가져옵니다.
    //    그리고 지역(region)과 선택(choice)으로 그룹화하여 개수를 셉니다.
    const rawResults = await this.votesRepository
      .createQueryBuilder('vote')
      .select('vote.region', 'region')
      .addSelect('vote.choice', 'choice')
      .addSelect('COUNT(vote.id)', 'count')
      .where('vote.topic.id = :topicId', { topicId })
      .groupBy('vote.region, vote.choice')
      .getRawMany();

    // 2. DB에서 가져온 데이터를 우리가 원하는 최종 형태로 가공합니다.
    const results: ResultsDto = {
      total: { A: 0, B: 0, total_votes: 0 },
      by_region: {},
    };

    for (const result of rawResults) {
      const { region, choice, count } = result;
      const voteCount = parseInt(count, 10);

      // 지역별 데이터 만들기
      if (!results.by_region[region]) {
        results.by_region[region] = {};
      }
      results.by_region[region][choice] = voteCount;

      // 전체 합계 데이터 만들기
      if (choice === 'A') results.total.A += voteCount;
      if (choice === 'B') results.total.B += voteCount;
      results.total.total_votes += voteCount;
    }

    return results;
  }
  
}