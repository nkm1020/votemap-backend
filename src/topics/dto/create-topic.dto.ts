// src/topics/dto/create-topic.dto.ts

export class CreateTopicDto {
  title: string;
  option_a: string;
  option_b: string;
  image_url?: string;
  status?: 'preparing' | 'ongoing' | 'closed';
}

