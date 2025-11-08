// votemap-backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 추가: CORS 설정
  // 개발 환경에서 모든 localhost 포트를 허용합니다.
  app.enableCors({
    origin: true, // 모든 origin 허용 (개발 환경용)
    credentials: true,
  });

  // 백엔드 서버는 포트 3001에서 실행
  await app.listen(3001);
}
bootstrap();