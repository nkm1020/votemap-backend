// src/app.service.ts

import { Injectable, Inject, forwardRef, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Topic, TopicStatus } from './topics/topic.entity';
import { Vote } from './votes/vote.entity';
import { CreateVoteDto } from './votes/dto/create-vote.dto';
import { CreateTopicDto } from './topics/dto/create-topic.dto';
import { ResultsDto } from './results/results.dto';
import { VoteGateway } from './gateway/vote.gateway';


@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
    @InjectRepository(Vote) // 추가: Vote Repository 주입
    private votesRepository: Repository<Vote>,
    @Inject(forwardRef(() => VoteGateway))
    private voteGateway: VoteGateway,
  ) { }

  // src/app.service.ts
  async getCurrentTopic(): Promise<Topic | null> { // 수정: '또는 null'을 추가하여 약속을 명확히 함
    return this.topicsRepository.findOne({ where: { status: TopicStatus.ONGOING } });
  }

  async getTopic(id: number): Promise<Topic | null> {
    return this.topicsRepository.findOne({ where: { id } });
  }

  async checkVoteStatus(topicId: number, user?: any, userUuid?: string): Promise<{ hasVoted: boolean; canVoteAgain: boolean; lastVotedAt?: Date }> {
    const whereCondition: any = {
      topic: { id: topicId }
    };

    if (user) {
      whereCondition.user = { id: user.id };
    } else if (userUuid) {
      whereCondition.user_uuid = userUuid;
    } else {
      return { hasVoted: false, canVoteAgain: true };
    }

    const existingVote = await this.votesRepository.findOne({ where: whereCondition });

    if (!existingVote) {
      return { hasVoted: false, canVoteAgain: true };
    }

    // Check time diff (7 days)
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const timeDiff = now.getTime() - new Date(existingVote.voted_at).getTime();
    const canVoteAgain = timeDiff > sevenDaysInMs;

    return {
      hasVoted: true,
      canVoteAgain,
      lastVotedAt: existingVote.voted_at
    };
  }

  async createVote(createVoteDto: CreateVoteDto, user?: any): Promise<Vote> {
    // 1. Check for existing vote
    const whereCondition: any = {
      topic: { id: createVoteDto.topic_id }
    };

    if (user) {
      whereCondition.user = { id: user.id };
    } else {
      whereCondition.user_uuid = createVoteDto.user_uuid;
      // Also ensure this UUID hasn't voted as a user (though unlikely if not logged in)
    }

    const existingVote = await this.votesRepository.findOne({ where: whereCondition });

    // Re-vote Logic
    if (existingVote) {
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      const now = new Date();
      const timeDiff = now.getTime() - new Date(existingVote.voted_at).getTime();

      if (timeDiff > sevenDaysInMs) {
        // Allow re-vote: Update choice, region, and timestamp
        existingVote.choice = createVoteDto.choice;
        existingVote.region = createVoteDto.region;
        existingVote.voted_at = new Date();
        if (user) existingVote.user = user;

        const savedVote = await this.votesRepository.save(existingVote);

        // Broadcast updates
        const updatedResults = await this.getTopicResults(createVoteDto.topic_id);
        this.voteGateway.broadcastVoteUpdate(createVoteDto.topic_id, createVoteDto.region, createVoteDto.choice, updatedResults);
        this.voteGateway.broadcastResultsUpdate(createVoteDto.topic_id, updatedResults);

        return savedVote;
      } else {
        // Deny
        throw new ConflictException('Already voted for this topic within 7 days');
      }
    }

    const newVote = this.votesRepository.create({
      choice: createVoteDto.choice,
      region: createVoteDto.region,
      user_uuid: createVoteDto.user_uuid,
      topic: { id: createVoteDto.topic_id },
      user: user ? { id: user.id } : undefined // Link to user if logged in
    });

    const savedVote = await this.votesRepository.save(newVote);

    // Get updated results for this topic
    const updatedResults = await this.getTopicResults(createVoteDto.topic_id);

    // Broadcast vote update via WebSocket
    this.voteGateway.broadcastVoteUpdate(
      createVoteDto.topic_id,
      createVoteDto.region,
      createVoteDto.choice,
      updatedResults,
    );

    // Also broadcast full results update
    this.voteGateway.broadcastResultsUpdate(createVoteDto.topic_id, updatedResults);

    return savedVote;
  }

  async getSelectableTopics(): Promise<Topic[]> {
    return this.topicsRepository.find({
      where: {
        status: Not(TopicStatus.CLOSED),
      },
    });
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

  async deleteAllVotes(): Promise<{ message: string; count: number }> {
    try {
      const votes = await this.votesRepository.find();
      const count = votes.length;
      await this.votesRepository.remove(votes);
      return {
        message: 'All votes deleted successfully',
        count: count,
      };
    } catch (error) {
      console.error('Error deleting votes:', error);
      throw error;
    }
  }

  async deleteVotesByRegion(region: string): Promise<{ message: string; count: number }> {
    try {
      const votes = await this.votesRepository.find({ where: { region } });
      const count = votes.length;
      if (count > 0) {
        await this.votesRepository.remove(votes);
      }
      return {
        message: `Votes for region ${region} deleted successfully`,
        count: count,
      };
    } catch (error) {
      console.error('Error deleting votes:', error);
      throw error;
    }
  }

  async createTopic(createTopicDto: CreateTopicDto): Promise<Topic> {
    const topic = this.topicsRepository.create({
      title: createTopicDto.title,
      option_a: createTopicDto.option_a,
      option_b: createTopicDto.option_b,
      image_url: createTopicDto.image_url || undefined,
      status: createTopicDto.status
        ? (createTopicDto.status as TopicStatus)
        : TopicStatus.ONGOING,
    });
    const savedTopic = await this.topicsRepository.save(topic);
    return savedTopic;
  }

  async updateTopic(id: number, updateData: Partial<Topic>): Promise<Topic | null> {
    await this.topicsRepository.update(id, updateData);
    return this.topicsRepository.findOne({ where: { id } });
  }

  async getUserStats(user_uuid: string) {
    const votes = await this.votesRepository.find({
      where: { user_uuid },
      relations: ['topic'],
    });

    if (votes.length === 0) {
      return {
        total_votes: 0,
        match_rate: 0,
        title: 'Newcomer',
        description: '첫 투표를 기다리고 있습니다.',
      };
    }

    let matchCount = 0;

    // Analyze each vote
    for (const vote of votes) {
      // Optimize: Ideally cache this or fetch in bulk, but for now iterate
      const results = await this.getTopicResults(vote.topic.id);
      const regionData = results.by_region[vote.region];

      if (regionData) {
        const aVotes = regionData.A || 0;
        const bVotes = regionData.B || 0;

        // Determine majority
        let majority = 'draw';
        if (aVotes > bVotes) majority = 'A';
        if (bVotes > aVotes) majority = 'B';

        if (vote.choice === majority) {
          matchCount++;
        }
      }
    }

    const matchRate = (matchCount / votes.length) * 100;

    let title = 'Citizen';
    let description = '평범한 시민입니다.';

    if (votes.length >= 50) {
      title = 'Opinion Leader';
      description = '여론을 주도하는 헤비 유저입니다.';
    } else if (matchRate >= 90 && votes.length >= 5) {
      title = 'Native';
      description = '이 구역의 토박이! 지역 여론과 완벽하게 일치합니다.';
    } else if (matchRate <= 20 && votes.length >= 5) {
      title = 'Rebel';
      description = '고독한 반란군. 남들과는 다른 길을 갑니다.';
    } else if (matchRate >= 60) {
      title = 'Trend Follower';
      description = '대세를 따르는 편입니다.';
    }

    return {
      total_votes: votes.length,
      match_rate: Math.round(matchRate),
      title,
      description,
      votes, // Optional: return detailed history
    };
  }

}