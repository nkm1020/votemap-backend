# Render 배포 가이드

## 백엔드 배포 (Render Web Service)

### 1. 환경 변수 설정

Render 대시보드에서 다음 환경 변수들을 설정하세요:

#### 데이터베이스 연결 (Render PostgreSQL 사용 시)
```
DB_HOST=<Render에서 제공하는 PostgreSQL 호스트>
DB_PORT=5432
DB_USERNAME=<Render에서 제공하는 PostgreSQL 사용자명>
DB_PASSWORD=<Render에서 제공하는 PostgreSQL 비밀번호>
DB_NAME=<Render에서 제공하는 PostgreSQL 데이터베이스명>
DB_SSL=true
```

#### CORS 설정
```
CORS_ORIGINS=https://your-frontend-url.onrender.com,https://your-frontend-url.vercel.app
```
- 프론트엔드 배포 URL을 쉼표로 구분하여 입력
- 예: `https://votemap-frontend.onrender.com,https://votemap.vercel.app`

#### 기타
```
NODE_ENV=production
PORT=10000
```
- `PORT`는 Render가 자동으로 설정하므로 설정하지 않아도 됩니다.

### 2. Build & Start 명령어

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

### 3. 데이터베이스 초기화

배포 후 데이터베이스가 자동으로 초기화됩니다 (`synchronize: true`가 개발 모드에서만 활성화되도록 설정됨).

프로덕션에서는 `synchronize: false`로 설정하고 마이그레이션을 사용하는 것을 권장합니다.

---

## 프론트엔드 배포 (Render Static Site 또는 Vercel)

### 1. 환경 변수 설정

**Render Static Site 또는 Vercel 환경 변수:**

```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

- 백엔드 배포 URL을 입력하세요
- 예: `https://votemap-backend.onrender.com`

### 2. Build 설정

**Build Command:**
```bash
npm install && npm run build
```

**Output Directory:**
```
.next
```

---

## Render PostgreSQL 데이터베이스 생성

1. Render 대시보드에서 "New +" → "PostgreSQL" 선택
2. 데이터베이스 이름 설정
3. 생성 후 제공되는 연결 정보를 백엔드 환경 변수에 입력

### 연결 정보 확인 방법
- Render PostgreSQL 대시보드에서 "Connections" 탭 확인
- Internal Database URL 또는 External Database URL 사용 가능
- Internal URL 형식: `postgresql://votemap_db_user:PGEDmZqedtx5E9O16lXMCSRD0QQRwSHa@dpg-d47eqnjipnbc73cqn5sg-a.oregon-postgres.render.com/votemap_db
`

---

## 주의사항

1. **SSL 연결**: Render PostgreSQL은 SSL 연결을 요구하므로 `DB_SSL=true` 설정 필수
2. **CORS**: 프론트엔드 URL을 정확히 입력해야 API 요청이 정상 작동
3. **WebSocket**: Socket.IO 연결도 동일한 백엔드 URL 사용
4. **환경 변수**: 프론트엔드는 `NEXT_PUBLIC_` 접두사가 필요 (클라이언트 사이드 접근)

---

## 배포 후 확인 사항

1. 백엔드 API 엔드포인트 확인: `https://your-backend-url.onrender.com/topics`
2. 프론트엔드에서 백엔드 연결 확인
3. WebSocket 연결 확인 (결과 페이지에서 실시간 업데이트)
4. 데이터베이스 연결 확인 (투표 생성 및 조회)


