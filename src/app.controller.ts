// src/app.controller.ts

import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { Topic } from './topics/topic.entity';
import { CreateVoteDto } from './votes/dto/create-vote.dto'; 
import { Vote } from './votes/vote.entity'; 
import { ResultsDto } from './results/results.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // 기존 Get()을 수정합니다.
  @Get('/topics')
  async getSelectableTopics(): Promise<Topic[]> {
    return this.appService.getSelectableTopics();
  }

  @Get('/topics/current') // API 주소를 '/topics/current'로 변경
  async getCurrentTopic(): Promise<Topic | null> {
    return this.appService.getCurrentTopic();
  }

  @Post('/votes') // POST 방식으로 /votes 주소의 요청을 받습니다.
  async createVote(@Body() createVoteDto: CreateVoteDto): Promise<Vote> {
    return this.appService.createVote(createVoteDto);
  }

  @Get('/topics/:id') // Get topic by ID
  async getTopic(@Param('id') id: string): Promise<Topic | null> {
    return this.appService.getTopic(parseInt(id, 10));
  }

  @Get('/topics/:id/results') // :id 자리에 숫자가 들어옵니다.
  async getTopicResults(@Param('id') id: string): Promise<ResultsDto> {
    return this.appService.getTopicResults(parseInt(id, 10));
  }

  @Delete('/votes') // 모든 투표 데이터 삭제
  async deleteAllVotes(): Promise<{ message: string; count: number }> {
    return this.appService.deleteAllVotes();
  }

}