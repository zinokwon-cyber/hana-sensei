# 운영 환경 구축 가이드

## 아키텍처 개요

```
Internet
    │
    ▼
[Route 53 / DNS]
    │
    ▼
[AWS Application Load Balancer] ← SSL/TLS Termination
    │
    ├──▶ [EC2 / ECS] Nginx
    │           │
    │     ┌─────┴──────┐
    │     ▼             ▼
    │  [Frontend]    [Backend]
    │  Next.js 15   FastAPI
    │
    ▼
[RDS PostgreSQL 16]
    ─── [S3 + CloudFront] (이모티콘 이미지 저장)
```

---

## 1. AWS 인프라 구성

### 1-1. VPC 설정

```bash
# VPC CIDR: 10.0.0.0/16
# Public Subnet:  10.0.1.0/24 (AZ-a), 10.0.2.0/24 (AZ-c)
# Private Subnet: 10.0.10.0/24 (AZ-a), 10.0.20.0/24 (AZ-c)
```

### 1-2. RDS PostgreSQL

```bash
# 권장 사양
Engine:             PostgreSQL 16
Instance class:     db.t3.medium (소규모) / db.r6g.large (대규모)
Storage:            gp3 100GB
Multi-AZ:           Yes (운영)
Backup retention:   7 days
Encryption:         Yes (KMS)
```

```sql
-- RDS 접속 후 DB/User 생성
CREATE DATABASE emoji_studio;
CREATE USER emoji_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE emoji_studio TO emoji_user;
\c emoji_studio
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1-3. S3 버킷

```bash
# 버킷 생성
aws s3 mb s3://3top-emoji-studio-prod --region ap-northeast-2

# 버킷 정책 (퍼블릭 읽기 또는 CloudFront OAC 사용 권장)
# CloudFront OAC 설정 시 S3 퍼블릭 액세스 차단 유지
```

### 1-4. CloudFront 배포

```bash
Origin: S3 버킷 (OAC 방식)
Price Class: PriceClass_200 (아시아 포함)
CNAME: cdn.emoji.3top.co.kr
SSL: ACM 인증서
Cache TTL: 31536000 (1년)
```

---

## 2. EC2 / ECS 배포

### Docker Compose 배포 (소규모)

```bash
# EC2 인스턴스: t3.medium (2 vCPU, 4GB RAM)
# Amazon Linux 2023

# 1. Docker 설치
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# 2. Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. 소스 배포
git clone https://github.com/3top/emoji-studio.git /app/emoji-studio
cd /app/emoji-studio

# 4. 환경 변수 설정
cp .env.sample .env
vim .env  # 운영 값 입력

# 5. SSL 인증서 (Let's Encrypt)
sudo certbot certonly --standalone -d emoji.3top.co.kr
sudo cp /etc/letsencrypt/live/emoji.3top.co.kr/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/emoji.3top.co.kr/privkey.pem nginx/ssl/key.pem

# 6. 빌드 & 실행
docker compose -f docker-compose.yml up -d --build

# 7. DB 마이그레이션
docker compose exec backend alembic upgrade head
```

---

## 3. 환경 변수 (운영)

AWS Systems Manager Parameter Store 또는 Secrets Manager 사용을 권장합니다.

```bash
# Secrets Manager에 저장
aws secretsmanager create-secret \
  --name "emoji-studio/prod" \
  --secret-string file://.env
```

---

## 4. CI/CD (GitHub Actions)

`.github/workflows/deploy.yml` 참고.

```yaml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker images
        run: |
          docker build -t emoji-studio-backend ./backend
          docker build -t emoji-studio-frontend ./frontend
      - name: Deploy to EC2
        run: |
          ssh ec2-user@${{ secrets.EC2_HOST }} "
            cd /app/emoji-studio &&
            git pull &&
            docker compose up -d --build &&
            docker compose exec -T backend alembic upgrade head
          "
```

---

## 5. 모니터링

### CloudWatch 알람 설정

```bash
# 1. CPU 사용률 > 80%
aws cloudwatch put-metric-alarm \
  --alarm-name "EmojiStudio-CPU-High" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --period 300

# 2. 에러율 모니터링은 Backend 로그에서 확인
docker compose logs --tail=100 backend
```

---

## 6. 백업

### DB 백업

```bash
# RDS 자동 백업 (콘솔에서 7일 보존 설정)
# 수동 스냅샷
aws rds create-db-snapshot \
  --db-instance-identifier emoji-studio-prod \
  --db-snapshot-identifier emoji-studio-$(date +%Y%m%d)
```

### S3 버킷 복제

```bash
# 동일 리전 복제 (DR 목적)
aws s3 sync s3://3top-emoji-studio-prod s3://3top-emoji-studio-backup
```

---

## 7. 도메인 설정

```
# Route 53 레코드
emoji.3top.co.kr  → A 레코드 → EC2 Elastic IP (또는 ALB)
cdn.emoji.3top.co.kr → CNAME → CloudFront 도메인
```

---

## 8. 보안 체크리스트

- [ ] HTTPS 강제 리다이렉트 (Nginx 설정)
- [ ] Security Groups: 80/443만 인바운드 허용
- [ ] RDS Security Group: 앱 서버 IP만 허용 (5432)
- [ ] S3 버킷 퍼블릭 액세스 차단 + CloudFront OAC
- [ ] AWS IAM 최소 권한 원칙 적용
- [ ] JWT_SECRET_KEY 32바이트 이상 랜덤값
- [ ] Azure AD 운영 테넌트 Redirect URI 등록
- [ ] CloudWatch 에러 알람 설정
- [ ] SSL 인증서 자동 갱신 (Let's Encrypt cron)
