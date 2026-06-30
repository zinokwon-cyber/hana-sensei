# 3TOP Emoji Studio API 명세

Base URL: `https://emoji.3top.co.kr/api`
Interactive Docs: `https://emoji.3top.co.kr/api/docs` (Swagger UI)

## 인증

모든 보호된 엔드포인트는 `Authorization: Bearer <JWT>` 헤더 필요.

JWT는 `/api/auth/login` 호출 시 발급됩니다.

---

## Authentication

### POST /auth/login

Microsoft Azure AD 인가 코드를 JWT로 교환합니다.

**Query Parameters**

| Parameter | Type   | Required | Description                                |
|-----------|--------|----------|--------------------------------------------|
| code      | string | Yes      | Azure AD OAuth2 authorization code         |

**Response 200**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@3top.co.kr",
    "name": "홍길동",
    "created_at": "2024-01-15T09:00:00+09:00"
  }
}
```

**Response 401** — Microsoft 인증 실패
```json
{ "detail": "Failed to authenticate with Microsoft" }
```

---

### GET /auth/me

현재 로그인된 사용자 정보를 반환합니다.

**Headers**: `Authorization: Bearer <token>`

**Response 200**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@3top.co.kr",
  "name": "홍길동",
  "created_at": "2024-01-15T09:00:00+09:00"
}
```

---

## Emojis

### POST /emojis/generate

AI를 사용하여 새 이모티콘을 생성합니다.

**Headers**: `Authorization: Bearer <token>`

**Request Body**
```json
{
  "title": "회의중",
  "style": "귀여움"
}
```

| Field | Type   | Required | Values                     |
|-------|--------|----------|----------------------------|
| title | string | Yes      | 업무 상태명 (max 50 chars) |
| style | string | No       | 기본/귀여움/집중/행복 (default: 기본) |

**Response 201**
```json
{
  "id": "7f3c1a2b-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "회의중",
  "prompt": "A cute corporate mascot character called '3TOP Buddy'...",
  "image_url": "https://cdn.emoji.3top.co.kr/emojis/user-id/emoji-id.png",
  "style": "귀여움",
  "created_at": "2024-01-15T10:30:00+09:00"
}
```

**Response 422** — Validation error
**Response 500** — OpenAI API 오류

---

### GET /emojis

현재 사용자의 이모티콘 목록을 반환합니다.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**

| Parameter | Type    | Default | Description         |
|-----------|---------|---------|---------------------|
| page      | integer | 1       | 페이지 번호 (≥ 1)   |
| size      | integer | 12      | 페이지당 항목 수 (1-100) |

**Response 200**
```json
{
  "items": [
    {
      "id": "7f3c1a2b-...",
      "user_id": "550e8400-...",
      "title": "회의중",
      "prompt": "...",
      "image_url": "https://cdn.emoji.3top.co.kr/emojis/.../....png",
      "style": "귀여움",
      "created_at": "2024-01-15T10:30:00+09:00"
    }
  ],
  "total": 42,
  "page": 1,
  "size": 12,
  "pages": 4
}
```

---

### GET /emojis/{id}

특정 이모티콘을 조회합니다.

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**

| Parameter | Type | Description     |
|-----------|------|-----------------|
| id        | UUID | 이모티콘 ID      |

**Response 200** — `EmojiResponse` 객체
**Response 404** — 이모티콘을 찾을 수 없음

---

### DELETE /emojis/{id}

이모티콘을 삭제합니다. S3에서도 함께 삭제됩니다.

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**

| Parameter | Type | Description     |
|-----------|------|-----------------|
| id        | UUID | 이모티콘 ID      |

**Response 204** — 삭제 완료
**Response 404** — 이모티콘을 찾을 수 없음

---

## Health Check

### GET /health

서비스 상태를 확인합니다. (인증 불필요)

**Response 200**
```json
{
  "status": "healthy",
  "service": "3TOP Emoji Studio"
}
```

---

## Error Format

모든 에러 응답은 다음 형식을 사용합니다:

```json
{
  "detail": "에러 메시지"
}
```

## HTTP Status Codes

| Code | Description                    |
|------|--------------------------------|
| 200  | 성공                           |
| 201  | 생성 완료                      |
| 204  | 삭제 완료 (내용 없음)           |
| 400  | 잘못된 요청                    |
| 401  | 인증 실패 / 토큰 없음           |
| 404  | 리소스를 찾을 수 없음           |
| 422  | 유효성 검사 오류               |
| 500  | 서버 내부 오류                 |
