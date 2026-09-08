# Digital Time Capsule

Private web app that stores letters, photos, voice notes, vibe checks, and family messages until **00:00:00 Asia/Manila on the recipient’s 18th birthday**.

The UI is **not** the lock. Unlock is decided by:

1. A Firestore `unlockAt` **Timestamp** written by the Admin SDK
2. Firestore / Storage Security Rules comparing `request.time` to that timestamp
3. Next.js API routes that re-check server time before returning sealed content

Changing the device clock, React state, CSS, or URLs cannot reveal sealed documents or files.

## Scripts

```bash
npm install
cp .env.example .env.local
npm run dev
npm run test
npm run typecheck
npm run lint
npm run build
```

## Docs

See [FIREBASE.md](./FIREBASE.md) for project setup, schema, rules, App Check, deployment, and remaining manual steps.

## Roles

| Role | Can do | Cannot do |
| --- | --- | --- |
| **ADMIN** | Config, users/family emails, system status, memories, unlock date (confirmed + audited) | — |
| **FAMILY** | Create/manage own family messages and media | Read recipient sealed content; read other family sealed content |
| **RECIPIENT** | Deposit personal memories | Read any sealed content (including her own files) until unlock |

After unlock, the recipient can read capsule memories and family messages through rules **and** `/api/vault/content`.
