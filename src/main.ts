// votemap-backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? allowedOrigins 
      : true, // 개발 환경에서는 모든 origin 허용
    credentials: true,
  });

  // 포트 설정 (Render는 PORT 환경 변수를 제공)
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();