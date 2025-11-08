// src/gateway/vote.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// CORS 설정을 환경 변수에서 가져오기
const getCorsOrigins = () => {
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
  }
  // 개발 환경 기본값
  return ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
};

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? getCorsOrigins() 
      : true, // 개발 환경에서는 모든 origin 허용
    credentials: true,
  },
})
export class VoteGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Subscribe to a specific topic's results
  @SubscribeMessage('subscribe_topic')
  handleSubscribeTopic(client: Socket, topicId: number) {
    client.join(`topic_${topicId}`);
    console.log(`Client ${client.id} subscribed to topic ${topicId}`);
  }

  // Unsubscribe from a topic
  @SubscribeMessage('unsubscribe_topic')
  handleUnsubscribeTopic(client: Socket, topicId: number) {
    client.leave(`topic_${topicId}`);
    console.log(`Client ${client.id} unsubscribed from topic ${topicId}`);
  }

  // Broadcast vote update to all clients subscribed to a topic
  broadcastVoteUpdate(topicId: number, region: string, choice: string, results: any) {
    this.server.to(`topic_${topicId}`).emit('vote_update', {
      topicId,
      region,
      choice,
      results,
    });
    console.log(`Broadcasted vote update for topic ${topicId}, region ${region}`);
  }

  // Broadcast full results update for a topic
  broadcastResultsUpdate(topicId: number, results: any) {
    this.server.to(`topic_${topicId}`).emit('results_update', {
      topicId,
      results,
    });
    console.log(`Broadcasted full results update for topic ${topicId}`);
  }
}



