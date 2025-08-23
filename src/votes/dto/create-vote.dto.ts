// src/votes/dto/create-vote.dto.ts

export class CreateVoteDto {
  topic_id: number;
  choice: string;
  region: string;
}