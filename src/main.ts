// votemap-backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 추가: CORS 설정
  // localhost:3001 에서 오는 요청을 허용합니다.
  app.enableCors({
    origin: 'http://localhost:3001',
  });

  await app.listen(3000);
}
bootstrap();