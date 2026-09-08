# Firebase setup

This app is a **single private capsule**. Do not treat the frontend as trusted.

## 1. Create a Firebase project

1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** → Email/Password and (optional) Google.
3. Create a Firestore database (production mode).
4. Enable **Storage**.
5. Register a **Web** app and copy the client config into `.env.local`.
6. Project Settings → Service accounts → Generate a new private key.  
   Put `project_id`, `client_email`, and `private_key` into:

   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY` (keep `\n` escaped as `\\n` in `.env.local`)

Never commit the JSON key. Never prefix admin values with `NEXT_PUBLIC_`.

## 2. Environment

Copy `.env.example` → `.env.local`.

Required client vars:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_CAPSULE_ID`

Required server vars:

- `FIREBASE_ADMIN_*`
- `ADMIN_EMAILS` — comma-separated
- `RECIPIENT_EMAIL`
- `FAMILY_EMAILS` (optional seed)
- `SEED_BIRTH_DATE` (`YYYY-MM-DD`) used only on first admin **Initialize capsule**

Authorized emails receive custom claims `{ role, capsuleId }` on login. Unknown emails are rejected.

## 3. Deploy rules and indexes

```bash
npm i -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes,storage
```

`unlockAt` **must** be a Firestore `Timestamp` (the admin API writes this). If it is stored as a string, rules stay locked forever.

## 4. App Check

1. App Check → Register **reCAPTCHA v3** for the web app.
2. Set `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`.
3. In App Check enforcement, start in **monitoring**, then enforce Authentication, Firestore, and Storage once traffic looks healthy.

Local dev can leave the site key empty (initialization is skipped).

## 5. First run

1. Sign in with an `ADMIN_EMAILS` account.
2. Open `/admin` → **Initialize capsule from seed env**.
3. Confirm birth date. Unlock = that date + 18 years at `00:00:00` `Asia/Manila`.
4. Invite family emails, then they can register with the same email.

## 6. Firestore schema

```
users/{userId}
  email, displayName, role, capsuleId, createdAt, lastLoginAt
  # written only by Admin SDK

capsules/{capsuleId}
  id, title, recipientName, status

capsules/{capsuleId}/settings/config
  birthDate, timezone, unlockAt (Timestamp), welcomeMessage,
  maxImageBytes, maxAudioBytes, maxRecordingSeconds, familyEmails, ...
  # Admin SDK only

capsules/{capsuleId}/memoryIndex/{memoryId}
  id, capsuleId, authorId, authorRole, type, createdAt, status, mediaCount, hasAudio
  # safe metadata only — readable by capsule members

capsules/{capsuleId}/memories/{memoryId}
  full content, vibe, storagePaths
  # readable by admin always; recipient only when request.time >= unlockAt

capsules/{capsuleId}/familyIndex/{messageId}
  safe metadata

capsules/{capsuleId}/familyMessages/{messageId}
  full family content
  # author + admin before unlock; recipient after unlock

capsules/{capsuleId}/auditLogs/{logId}
  action, actorId, actorRole, metadata (no memory bodies)
  # admin read; Admin SDK write
```

Do not copy sealed `content` into `memoryIndex`.

## 7. Security rules (summary)

**Firestore**

- Users cannot write their own `role`.
- Config is Admin SDK only.
- `memories` reads require `role == admin` **or** (`role == recipient` **and** `request.time >= config.unlockAt`).
- Family can read **only their** `familyMessages` before unlock.
- Index collections must not contain `content` / `storagePaths` / `vibe`.

**Storage** path:

`capsules/{capsuleId}/users/{userId}/{memories|family}/{itemId}/{photos|audio}/{fileId}`

- Write: owner + matching role + MIME + size limits.
- Read: admin; family owner; recipient **only after** `unlockAt`.
- Recipient cannot download her own sealed files early (preview uses local blobs).

## 8. Authentication

- Firebase Auth (email/password + Google).
- Server verifies ID token, sets custom claims, writes `users/{uid}`.
- HttpOnly `__session` cookie via `createSessionCookie`.
- Middleware only checks cookie **presence**. APIs verify the cookie with Admin SDK.
- Route guards are UX only.

## 9. Time

- Countdown offset comes from `GET /api/time` (`Date` on the server).
- UI ticks locally but **re-syncs** every 30s, on tab focus, and on reconnect.
- Hitting 00:00 locally does **not** unlock; the client re-fetches `/api/time`.
- Sealed bodies are loaded via `/api/vault/content` after that server flag (and rules still apply if someone queries Firestore directly).

## 10. Testing

Unit tests (no Firebase emulator required):

```bash
npm test
```

Covers Manila boundary `23:59:59` → locked, `00:00:00` → unlocked, permissions, file types.

### Rules emulator strategy

Use `@firebase/rules-unit-testing` against the emulator:

1. Authenticate with claims `{ role, capsuleId }`.
2. Seed `settings/config.unlockAt` as a Timestamp just after / before `now`.
3. Assert `memories/{id}` get **denied** one second before unlock and **allowed** for recipient at/after unlock.
4. Assert storage downloads follow the same Timestamp.
5. Assert a recipient with a spoofed client clock still fails rules (rules use `request.time`).

## 11. Deployment

- Host the Next.js app on Vercel/Cloud Run with all env vars.
- Deploy rules with Firebase CLI whenever they change.
- Production build: `npm run build`.
- Do not cache sealed media in a public CDN or insecure service worker. This PWA manifest does **not** precache vault files.

## 12. Orphan files

If a user uploads then fails to write the Firestore doc, objects can remain under their user prefix. Periodically list Storage prefixes and delete objects whose `{itemId}` is missing from `memories` / `familyMessages`. Prefer a scheduled Cloud Function for this.

## 13. Limitations / manual steps

- In-memory API rate limits are per instance; use Upstash/Redis in front of auth routes at scale.
- App Check enforcement is a Console toggle, not hardcoded secrets.
- HEIC is allowed by MIME; some browsers cannot preview it — JPEG/PNG/WEBP still work.
- First user must be listed in `ADMIN_EMAILS` or they cannot initialize the capsule.
- Changing unlock date requires the admin checkbox + server confirmation; it is always audit-logged.
- Custom claims need a token refresh (the app forces `getIdToken(true)` after bootstrap).
