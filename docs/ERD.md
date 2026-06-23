# ERD (Entity Relationship Diagram)

## 3TOP Emoji Studio Database Schema

```
┌─────────────────────────────────────────────┐
│                   users                      │
├──────────────┬──────────────────────────────┤
│ PK id        │ UUID          NOT NULL        │
│    email     │ VARCHAR(255)  NOT NULL UNIQUE │
│    name      │ VARCHAR(255)  NOT NULL        │
│    azure_oid │ VARCHAR(255)  UNIQUE          │
│    created_at│ TIMESTAMPTZ   NOT NULL        │
└──────────────┴──────────────────────────────┘
        │ 1
        │
        │ N
┌─────────────────────────────────────────────┐
│                   emojis                     │
├──────────────┬──────────────────────────────┤
│ PK id        │ UUID          NOT NULL        │
│ FK user_id   │ UUID          NOT NULL        │
│    title     │ VARCHAR(255)  NOT NULL        │
│    prompt    │ TEXT          NOT NULL        │
│    image_url │ TEXT          NOT NULL        │
│    style     │ VARCHAR(50)   NOT NULL        │
│    created_at│ TIMESTAMPTZ   NOT NULL        │
└──────────────┴──────────────────────────────┘
```

## Relationships

- `users` 1:N `emojis` — 한 사용자가 여러 이모티콘을 생성할 수 있습니다
- `emojis.user_id` → `users.id` (CASCADE DELETE)

## Indexes

| Table  | Index Name          | Columns   | Type   |
|--------|---------------------|-----------|--------|
| users  | ix_users_email      | email     | UNIQUE |
| users  | ix_users_azure_oid  | azure_oid | UNIQUE |
| emojis | ix_emojis_user_id   | user_id   | INDEX  |

## Field Descriptions

### users
| Field      | Description                                        |
|------------|----------------------------------------------------|
| id         | UUID primary key (auto-generated)                  |
| email      | Microsoft 계정 이메일 (unique)                       |
| name       | Microsoft 프로필 표시 이름                            |
| azure_oid  | Microsoft Entra ID Object ID (unique identifier)   |
| created_at | 최초 로그인/가입 시각                                  |

### emojis
| Field     | Description                                               |
|-----------|-----------------------------------------------------------|
| id        | UUID primary key (auto-generated)                         |
| user_id   | 생성한 사용자 (FK → users.id)                              |
| title     | 사용자가 입력한 상태명 (예: 회의중)                          |
| prompt    | OpenAI에 전달된 전체 프롬프트 (감사 로그 목적)               |
| image_url | S3 또는 CloudFront에 저장된 PNG 이미지 URL                  |
| style     | 선택된 스타일 (기본/귀여움/집중/행복)                        |
| created_at| 이모티콘 생성 시각                                         |
