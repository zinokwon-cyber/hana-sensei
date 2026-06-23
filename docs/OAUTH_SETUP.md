# Microsoft Entra ID (Azure AD) OAuth 설정 가이드

## 1. Azure Portal에서 앱 등록

### 1-1. 앱 등록

1. [Azure Portal](https://portal.azure.com) 접속
2. **Microsoft Entra ID** → **App registrations** → **New registration**
3. 설정:
   - **Name**: `3TOP Emoji Studio`
   - **Supported account types**: `Accounts in this organizational directory only (3TOP only - Single tenant)`
   - **Redirect URI**: 아래 표 참고

### 1-2. Redirect URI 등록

| 환경   | URI                                          |
|--------|----------------------------------------------|
| 개발   | `http://localhost:3000/auth/callback`         |
| 운영   | `https://emoji.3top.co.kr/auth/callback`     |

### 1-3. Client Secret 생성

1. **Certificates & secrets** → **Client secrets** → **New client secret**
2. Description: `EmojiStudio-Prod-Secret`
3. Expires: 24 months
4. **생성 즉시 값 복사** (이후 재확인 불가)

### 1-4. API Permissions 설정

1. **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated**
2. 필요 권한 추가:
   - `openid` (기본 포함)
   - `profile`
   - `email`
   - `User.Read`
3. **Grant admin consent** 클릭

---

## 2. 앱 정보 확인

| 항목              | 위치                                                    |
|-------------------|---------------------------------------------------------|
| Application ID    | App registration → Overview → Application (client) ID  |
| Tenant ID         | App registration → Overview → Directory (tenant) ID    |
| Client Secret     | Certificates & secrets → Value (생성 시 1회만 표시)    |

---

## 3. 환경 변수 설정

### Backend (.env)

```bash
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your_client_secret_value
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_REDIRECT_URI=https://emoji.3top.co.kr/auth/callback
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AZURE_REDIRECT_URI=https://emoji.3top.co.kr/auth/callback
```

---

## 4. OAuth 플로우

```
1. 사용자가 [Microsoft 로그인] 버튼 클릭
   ↓
2. Frontend가 Microsoft 인가 URL로 리다이렉트
   URL: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
   Params: client_id, response_type=code, redirect_uri, scope
   ↓
3. 사용자가 Microsoft 계정으로 로그인 & 동의
   ↓
4. Microsoft가 redirect_uri로 authorization code 전달
   URL: https://emoji.3top.co.kr/auth/callback?code=xxxx
   ↓
5. Frontend가 코드를 Backend에 전달
   POST /api/auth/login?code=xxxx
   ↓
6. Backend가 Microsoft Token Endpoint에 코드 교환 요청
   → access_token 획득
   ↓
7. Backend가 Microsoft Graph API로 사용자 프로필 조회
   GET https://graph.microsoft.com/v1.0/me
   ↓
8. DB에 사용자 Upsert 후 JWT 발급
   ↓
9. Frontend가 JWT를 localStorage에 저장
   ↓
10. 이후 모든 API 요청에 Authorization: Bearer {JWT} 포함
```

---

## 5. 보안 고려사항

- Client Secret은 **반드시 서버 사이드(Backend)**에서만 사용
- Frontend에는 Client ID와 Tenant ID만 노출 (Public 정보)
- JWT 만료시간은 8시간으로 설정 (업무시간 기준)
- Redirect URI는 정확히 등록된 URI만 허용됨 (Azure 검증)
