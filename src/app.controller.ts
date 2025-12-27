// src/app.controller.ts

import { Controller, Get, Post, Delete, Patch, Body, Param, Request, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { Topic } from './topics/topic.entity';
import { CreateVoteDto } from './votes/dto/create-vote.dto';
import { CreateTopicDto } from './topics/dto/create-topic.dto';
import { Vote } from './votes/vote.entity';
import { ResultsDto } from './results/results.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) { }

  // 기존 Get()을 수정합니다.
  @Get('/topics')
  async getSelectableTopics(): Promise<Topic[]> {
    return this.appService.getSelectableTopics();
  }

  @Get('/topics/current') // API 주소를 '/topics/current'로 변경
  async getCurrentTopic(): Promise<Topic | null> {
    return this.appService.getCurrentTopic();
  }

  @Get('/votes/status')
  async checkVoteStatus(
    @Query('topic_id') topicId: string,
    @Query('user_uuid') userUuid: string,
    @Request() req
  ) {
    let user: any = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        const decoded = this.authService.verifyToken(token);
        if (decoded) user = { id: decoded.sub };
      }
    }
    return this.appService.checkVoteStatus(parseInt(topicId, 10), user, userUuid);
  }

  @Post('/votes') // POST 방식으로 /votes 주소의 요청을 받습니다.
  async createVote(@Body() createVoteDto: CreateVoteDto, @Request() req): Promise<Vote> {
    // Check for authorization header manually since we allow meaningful anonymous votes too
    // But we want to link user if logged in.
    // Ideally we use a "SoftGuard", but for now let's inspect the request or rely on a middleware.
    // If the frontend sends 'Authorization: Bearer ...', we want to parse it.

    // Quick fix: The standard AuthGuard throws 401 if failed. 
    // We can try to parse the header if present.
    // Instead of injecting JwtService here (which requires module shuffle),
    // let's pass the raw token or header to service? No, service shouldn't know about HTTP.

    // Let's assume the frontend sends the token. 
    // To properly validate, we need JwtService.
    // Let's rely on a simpler method: The frontend calls this endpoint.
    // If user is logged in, they are logged in.

    // I will inject JwtService into AppController.
    // Check if req.headers.authorization exists.

    let user = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        // Decode/Verify. Since I don't have JwtService injected yet, I need to do that first.
        // See next step.
      } catch (e) { }
    }

    return this.appService.createVote(createVoteDto, (req as any).user); // Assuming middleware or we fix injection
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

  @Delete('/votes/:region') // 특정 지역 투표 데이터 삭제
  async deleteVotesByRegion(@Param('region') region: string): Promise<{ message: string; count: number }> {
    return this.appService.deleteVotesByRegion(region);
  }

  @Post('/topics') // 주제 생성
  async createTopic(@Body() createTopicDto: CreateTopicDto): Promise<Topic> {
    return this.appService.createTopic(createTopicDto);
  }

  @Patch('/topics/:id') // 주제 수정
  async updateTopic(@Param('id') id: string, @Body() updateData: Partial<Topic>): Promise<Topic | null> {
    return this.appService.updateTopic(parseInt(id, 10), updateData);
  }

  @Get('/users/:uuid/stats')
  async getUserStats(@Param('uuid') uuid: string) {
    return this.appService.getUserStats(uuid);
  }


}