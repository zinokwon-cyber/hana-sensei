# 개발 환경 구축 가이드

## 사전 요구사항

| 도구          | 버전           | 설치 방법                                 |
|---------------|----------------|-------------------------------------------|
| Node.js       | 22.x           | https://nodejs.org 또는 `nvm install 22`  |
| Python        | 3.12.x         | https://python.org 또는 pyenv            |
| PostgreSQL    | 16.x           | `brew install postgresql@16` (macOS)      |
| Docker        | 24.x+          | https://docker.com/get-started            |
| Docker Compose| 2.x            | Docker Desktop에 포함                     |
| Git           | 2.x            | -                                         |

---

## 1. 저장소 클론

```bash
git clone https://github.com/3top/emoji-studio.git
cd emoji-studio
```

---

## 2. 환경 변수 설정

```bash
cp .env.sample .env
```

`.env` 파일을 열어 다음 값을 설정합니다:

```bash
# 필수 설정
OPENAI_API_KEY=sk-proj-...          # OpenAI API 키
AZURE_CLIENT_ID=...                  # Azure AD 앱 Client ID
AZURE_CLIENT_SECRET=...              # Azure AD 앱 Client Secret
AZURE_TENANT_ID=...                  # Azure AD 테넌트 ID
AWS_ACCESS_KEY_ID=...                # AWS 액세스 키
AWS_SECRET_ACCESS_KEY=...            # AWS 시크릿 키
S3_BUCKET_NAME=...                   # S3 버킷 이름

# JWT Secret 생성
JWT_SECRET_KEY=$(openssl rand -hex 32)
```

---

## 3. Docker Compose로 전체 실행 (권장)

```bash
# 전체 서비스 시작 (DB + Backend + Frontend + Nginx)
docker compose up -d

# 로그 확인
docker compose logs -f backend
docker compose logs -f frontend

# 접속
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api/docs
```

---

## 4. 개별 서비스 실행 (로컬 개발)

### 4-1. PostgreSQL 시작 (Docker만 사용)

```bash
docker compose up -d postgres
```

### 4-2. Backend (FastAPI)

```bash
cd backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# .env 심볼릭 링크 (루트에서 복사)
cp ../.env .env

# DB 마이그레이션
alembic upgrade head

# 개발 서버 실행 (hot-reload 포함)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API 문서 확인: http://localhost:8000/api/docs

### 4-3. Frontend (Next.js)

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.local.sample .env.local
# .env.local 편집 (NEXT_PUBLIC_* 값 설정)

# 개발 서버 실행
npm run dev
```

Frontend 접속: http://localhost:3000

---

## 5. 초기 데이터 시드 (선택)

```bash
cd backend
source venv/bin/activate
python scripts/seed.py
```

---

## 6. Azure AD 개발 설정

Azure Portal (portal.azure.com)에서:

1. **App registrations** → **New registration**
2. 이름: `3TOP Emoji Studio Dev`
3. Supported account types: `Accounts in this organizational directory only`
4. Redirect URI 추가:
   - Type: `Web`
   - URI: `http://localhost:3000/auth/callback`
5. **Certificates & secrets** → **New client secret** 생성
6. **API permissions** → `User.Read` 추가

---

## 7. AWS S3 개발 설정

```bash
# AWS CLI로 버킷 생성
aws s3 mb s3://3top-emoji-studio-dev --region ap-northeast-2

# 퍼블릭 액세스 설정 (개발용)
aws s3api put-public-access-block \
  --bucket 3top-emoji-studio-dev \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# 버킷 정책 적용 (public read)
aws s3api put-bucket-policy --bucket 3top-emoji-studio-dev --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::3top-emoji-studio-dev/*"
  }]
}'
```

---

## 8. 테스트

```bash
# Backend
cd backend
pytest tests/ -v

# Frontend lint
cd frontend
npm run lint
npm run type-check
```

---

## 트러블슈팅

### PostgreSQL 연결 실패

```bash
# 상태 확인
docker compose ps postgres
docker compose logs postgres

# 재시작
docker compose restart postgres
```

### Alembic 마이그레이션 오류

```bash
# 현재 상태 확인
alembic current

# 강제 초기화 (개발 환경만)
alembic downgrade base
alembic upgrade head
```

### OpenAI 응답 지연

이미지 생성은 20-30초 소요됩니다. `proxy_read_timeout 120s` 설정 확인.
