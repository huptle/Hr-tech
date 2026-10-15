# Mentorlee × Huptle Integration Guide

This guide details how **Mentorlee** integrates with **Huptle Job Portal (`apply.huptle.com`)** for:
1. **Job Syndication**: Fetching active Huptle job openings to display on Mentorlee.
2. **Seamless Single Sign-On (SSO)**: Allowing Mentorlee users to transition to Huptle without re-authenticating or signing up.

---

## 1. Authentication Credentials
Huptle will provide two configuration parameters to Mentorlee:
- **`PARTNER_API_KEY`**: Used to query the Jobs API.
- **`PARTNER_SSO_SECRET`**: A shared secret key used to cryptographically sign HMAC-SHA256 JWT tokens for 1-click user handoff.

---

## 2. Job Syndication API (Displaying Jobs on Mentorlee)

Mentorlee queries Huptle's public job openings to display them on Mentorlee's website or app.

### Endpoint
`GET https://apply.huptle.com/api/partner/jobs`

### Headers
```http
X-Partner-Key: <YOUR_PARTNER_API_KEY>
```
*(Or `Authorization: Bearer <YOUR_PARTNER_API_KEY>`)*

### Response Example (`200 OK`)
```json
{
  "success": true,
  "count": 2,
  "jobs": [
    {
      "id": "cm789abc0001xyz",
      "title": "Senior Full-Stack Engineer",
      "department": "Engineering",
      "location": "Remote, India",
      "mode": "Full-Time",
      "description": "We are seeking a senior full-stack engineer...",
      "screeningDurationMin": 15,
      "createdAt": "2026-10-10T12:00:00.000Z",
      "applyUrl": "https://apply.huptle.com/apply/cm789abc0001xyz",
      "matchUrl": "https://apply.huptle.com/match"
    }
  ]
}
```

---

## 3. Seamless 1-Click Single Sign-On (SSO)

When a logged-in user on Mentorlee clicks **"Apply on Huptle"** or **"View Job"**, Mentorlee generates a signed JWT and redirects the user's browser to Huptle. 

The user lands on Huptle **already logged in**, and their name and email are pre-filled.

### Redirect URL Format
```text
https://apply.huptle.com/auth/partner?token=<SIGNED_JWT>&redirect=/apply/<JOB_ID>
```

### JWT Payload Structure
Construct a standard JWT with header `{"alg": "HS256", "typ": "JWT"}` and the following payload:

```json
{
  "iss": "mentorlee",
  "sub": "mentorlee_user_12345",
  "email": "candidate@example.com",
  "name": "Jane Doe",
  "phone": "+919876543210",
  "redirect": "/apply/cm789abc0001xyz",
  "exp": 1729000300,
  "iat": 1729000000,
  "jti": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Description | Required |
|---|---|---|---|
| `sub` | string | Unique user ID on Mentorlee's database. | **Yes** |
| `email` | string | Candidate's verified email. | **Yes** |
| `name` | string | Candidate's display/full name. | Recommended |
| `phone` | string | Candidate's phone number. | Optional |
| `redirect` | string | Path on Huptle to send user after login (e.g. `/apply/<jobId>`). | Recommended |
| `exp` | integer | Expiration timestamp in seconds (recommended: `now + 300s`). | **Yes** |
| `iat` | integer | Issued at timestamp in seconds. | Recommended |
| `jti` | string | Unique UUID nonce to guarantee one-time use. | Recommended |

---

## 4. Implementation Code Examples for Mentorlee

### Node.js / TypeScript Example
```typescript
import jwt from "jsonwebtoken";

const PARTNER_SSO_SECRET = process.env.MENTORLEE_SSO_SECRET!;

export function getHuptleApplyUrl(user: { id: string; email: string; name: string }, jobId: string): string {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: "mentorlee",
    sub: user.id,
    email: user.email,
    name: user.name,
    redirect: `/apply/${jobId}`,
    iat: now,
    exp: now + 300, // Valid for 5 minutes
    jti: crypto.randomUUID(),
  };

  const token = jwt.sign(payload, PARTNER_SSO_SECRET, { algorithm: "HS256" });
  return `https://apply.huptle.com/auth/partner?token=${token}`;
}
```

### Python Example
```python
import time
import uuid
import jwt

PARTNER_SSO_SECRET = "your_shared_secret_here"

def get_huptle_apply_url(user_id: str, email: str, name: str, job_id: str) -> str:
    now = int(time.time())
    payload = {
        "iss": "mentorlee",
        "sub": str(user_id),
        "email": email,
        "name": name,
        "redirect": f"/apply/{job_id}",
        "iat": now,
        "exp": now + 300, # 5 minutes validity
        "jti": str(uuid.uuid4())
    }
    
    token = jwt.encode(payload, PARTNER_SSO_SECRET, algorithm="HS256")
    return f"https://apply.huptle.com/auth/partner?token={token}"
```

---

## 5. Security Summary
- **No Password Sharing**: User passwords and credentials are never exchanged or exposed.
- **Tamper-Proof**: Tokens are cryptographically signed. If a malicious user modifies the email or payload, the signature check fails immediately.
- **Short-Lived**: Tokens expire within 5 minutes (`exp`), preventing token reuse or replay attacks.
- **HttpOnly Cookies**: On landing, Huptle establishes an encrypted session protected from cross-site scripting (XSS).
