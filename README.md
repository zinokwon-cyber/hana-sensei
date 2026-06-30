# 3TOP Emoji Studio

3TOP 임직원이 회사 브랜드 캐릭터 **3TOP Buddy**를 활용하여 AI 기반 업무용 이모티콘을 생성하는 내부 웹서비스입니다.

## 브랜드 컬러

| 이름          | HEX       | 미리보기                  |
|---------------|-----------|--------------------------|
| Primary Purple | `#6B4E9A` | 주 색상 (버튼, 강조)       |
| Primary Blue   | `#3E5CB8` | 보조 색상                 |
| Accent Blue    | `#2C73D2` | 포인트 색상               |

## 기술 스택

| 영역          | 기술                                                 |
|---------------|------------------------------------------------------|
| Frontend      | Next.js 15, TypeScript, Tailwind CSS, Shadcn UI      |
| Backend       | FastAPI, Python 3.12                                 |
| Database      | PostgreSQL 16                                        |
| Storage       | AWS S3 + CloudFront                                  |
| Auth          | Microsoft Entra ID (Azure AD) OAuth2                 |
| AI            | OpenAI DALL-E 3                                      |
| Infra         | Docker, Docker Compose, Nginx                        |

## 프로젝트 구조

```
3top-emoji-studio/
├── frontend/                    # Next.js 15 애플리케이션
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/    # 로그인 페이지
│   │   │   ├── (dashboard)/
│   │   │   │   ├── generate/    # 이모티콘 생성
│   │   │   │   ├── my-emojis/   # 내 이모티콘
│   │   │   │   └── profile/     # 내 정보
│   │   │   └── auth/callback/   # OAuth 콜백
│   │   ├── components/
│   │   │   ├── ui/              # Shadcn UI 컴포넌트
│   │   │   ├── layout/          # 레이아웃 컴포넌트
│   │   │   └── emoji/           # 이모티콘 컴포넌트
│   │   ├── hooks/               # React 커스텀 훅
│   │   ├── lib/                 # 유틸리티 & API
│   │   └── types/               # TypeScript 타입
│   ├── Dockerfile
│   └── package.json
│
├── backend/                     # FastAPI 애플리케이션
│   ├── app/
│   │   ├── api/                 # API 라우터
│   │   │   ├── auth.py          # 인증 API
│   │   │   └── emojis.py        # 이모티콘 API
│   │   ├── core/                # 핵심 설정
│   │   │   ├── config.py        # 환경 변수
│   │   │   ├── database.py      # DB 연결
│   │   │   └── security.py      # JWT 보안
│   │   ├── models/              # SQLAlchemy ORM 모델
│   │   ├── schemas/             # Pydantic 스키마
│   │   ├── services/            # 비즈니스 로직
│   │   │   ├── ai_service.py    # OpenAI 연동
│   │   │   └── s3_service.py    # AWS S3 연동
│   │   └── main.py              # FastAPI 앱
│   ├── alembic/                 # DB 마이그레이션
│   ├── scripts/                 # 유틸리티 스크립트
│   ├── requirements.txt
│   └── Dockerfile
│
├── nginx/                       # Nginx 설정
├── scripts/                     # DB 초기화 스크립트
├── docs/                        # 문서
│   ├── API.md                   # API 명세
│   ├── ERD.md                   # DB 설계
│   ├── SETUP_DEV.md             # 개발 환경 가이드
│   ├── SETUP_PROD.md            # 운영 환경 가이드
│   ├── OAUTH_SETUP.md           # Azure AD OAuth 설정
│   └── S3_SETUP.md              # AWS S3 설정
├── docker-compose.yml
├── .env.sample
└── README.md
```

## 빠른 시작

### 1. 환경 변수 설정

```bash
cp .env.sample .env
# .env 파일에서 필수 값 입력:
# - OPENAI_API_KEY
# - AZURE_CLIENT_ID / AZURE_CLIENT_SECRET / AZURE_TENANT_ID
# - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / S3_BUCKET_NAME
# - JWT_SECRET_KEY (openssl rand -hex 32)
```

### 2. Docker Compose로 실행

```bash
docker compose up -d
```

### 3. DB 마이그레이션

```bash
docker compose exec backend alembic upgrade head
```

### 4. 접속

- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/api/docs

## 메뉴 구조

| 메뉴           | URL              | 설명                          |
|----------------|------------------|-------------------------------|
| 로그인         | `/login`         | Microsoft 계정 로그인          |
| 이모티콘 생성  | `/generate`      | AI 이모티콘 생성               |
| 내 이모티콘    | `/my-emojis`     | 생성된 이모티콘 목록           |
| 내 정보        | `/profile`       | 계정 정보 및 사용 현황         |

## API 엔드포인트

| Method | Endpoint                | 설명                     | 인증 필요 |
|--------|-------------------------|--------------------------|-----------|
| POST   | `/api/auth/login`       | Microsoft OAuth 로그인   | No        |
| GET    | `/api/auth/me`          | 현재 사용자 정보          | Yes       |
| POST   | `/api/emojis/generate`  | 이모티콘 생성             | Yes       |
| GET    | `/api/emojis`           | 이모티콘 목록             | Yes       |
| GET    | `/api/emojis/{id}`      | 이모티콘 상세             | Yes       |
| DELETE | `/api/emojis/{id}`      | 이모티콘 삭제             | Yes       |

## 지원 스타일

| 스타일 | 설명                     |
|--------|--------------------------|
| 기본   | 차분하고 프로페셔널한 표현 |
| 귀여움 | 귀엽고 사랑스러운 표현    |
| 집중   | 집중하고 열정적인 표현    |
| 행복   | 기쁘고 활기찬 표현        |

## 문서

- [API 명세](./docs/API.md)
- [ERD 다이어그램](./docs/ERD.md)
- [개발 환경 구축 가이드](./docs/SETUP_DEV.md)
- [운영 환경 구축 가이드](./docs/SETUP_PROD.md)
- [Azure AD OAuth 설정](./docs/OAUTH_SETUP.md)
- [AWS S3 설정](./docs/S3_SETUP.md)

## 라이선스

내부 사용 전용. © 2024 3TOP Co., Ltd. All rights reserved.
