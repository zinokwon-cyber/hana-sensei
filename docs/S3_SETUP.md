# AWS S3 설정 가이드

## 1. S3 버킷 생성

```bash
# 버킷 이름: 전 세계 고유해야 함
aws s3 mb s3://3top-emoji-studio-prod \
  --region ap-northeast-2

# 버전 관리 활성화
aws s3api put-bucket-versioning \
  --bucket 3top-emoji-studio-prod \
  --versioning-configuration Status=Enabled

# 수명 주기 정책 (오래된 버전 자동 삭제)
aws s3api put-bucket-lifecycle-configuration \
  --bucket 3top-emoji-studio-prod \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "delete-old-versions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {"NoncurrentDays": 30}
    }]
  }'
```

## 2. 버킷 정책 설정

### 방법 A: CloudFront OAC 사용 (권장)

CloudFront가 S3에 직접 접근하도록 설정. S3는 퍼블릭 차단 유지.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::3top-emoji-studio-prod/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

### 방법 B: 퍼블릭 읽기 허용 (개발환경만)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::3top-emoji-studio-dev/*"
    }
  ]
}
```

## 3. CORS 설정

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": [
      "https://emoji.3top.co.kr",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

```bash
aws s3api put-bucket-cors \
  --bucket 3top-emoji-studio-prod \
  --cors-configuration file://cors.json
```

## 4. IAM 사용자/역할 설정

### IAM 정책

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::3top-emoji-studio-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::3top-emoji-studio-prod"
    }
  ]
}
```

```bash
# IAM 사용자 생성
aws iam create-user --user-name emoji-studio-app

# 정책 연결
aws iam put-user-policy \
  --user-name emoji-studio-app \
  --policy-name EmojiStudioS3Policy \
  --policy-document file://iam-policy.json

# 액세스 키 생성
aws iam create-access-key --user-name emoji-studio-app
```

## 5. CloudFront 배포 (선택)

```bash
# 배포 생성 (콘솔 권장)
# Origins: S3 버킷
# Default Cache Behavior:
#   - Viewer Protocol Policy: Redirect HTTP to HTTPS
#   - Cache Policy: CachingOptimized
#   - Origin Request Policy: CORS-S3Origin
# 대체 도메인: cdn.emoji.3top.co.kr
# SSL 인증서: ACM (ap-northeast-1 리전에서 발급)
```

## 6. 파일 구조

```
s3://3top-emoji-studio-prod/
└── emojis/
    └── {user_id}/
        └── {emoji_id}.png
```

## 7. 비용 예상 (월간)

| 항목              | 예상 비용              |
|-------------------|------------------------|
| S3 저장 (10GB)    | $0.23                  |
| S3 PUT 요청 (1만) | $0.05                  |
| CloudFront (1TB)  | $8.50                  |
| **합계**          | **약 $9/월**           |
