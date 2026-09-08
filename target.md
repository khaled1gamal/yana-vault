Act as a Senior Full-Stack Engineer, Security Engineer, Firebase Architect, and Lead UI/UX Designer.

Build a complete, production-ready, highly interactive "Digital Time Capsule" web application for a 15-year-old Filipino girl. The capsule must remain securely sealed and must automatically unlock at the exact configured time of her 18th birthday.

IMPORTANT:
Do NOT blindly rewrite or replace the existing project.

If an existing codebase is provided:

1. Inspect the entire project structure first.
2. Identify the existing architecture, dependencies, routes, components, Firebase configuration, authentication, and styling system.
3. Reuse existing code wherever possible.
4. Do not introduce duplicate components or conflicting libraries.
5. Preserve existing functionality.
6. Before modifying files, explain the implementation plan.
7. Implement changes incrementally.
8. After each major change, verify that the project still builds.
9. Fix TypeScript/ESLint/build/runtime errors before continuing.
10. Never use fake/mock implementations when a real production implementation is required.

---

1. PRODUCT CONCEPT

The application is a private digital time capsule.

The recipient can deposit memories that will remain sealed until her 18th birthday.

Memories may include:

- Letters
- Photos
- Voice recordings
- Current favorites
- Dreams
- Personal messages
- Family messages
- Special memories

The system must enforce the unlock date on the SERVER.

The frontend must NEVER be trusted to decide whether the vault is unlocked.

---

2. TIME & UNLOCK LOGIC

Create a centralized configuration:

birthDate:
YYYY-MM-DD

timezone:
Asia/Manila

unlockAt:
18th birthday at 00:00:00 Asia/Manila

The unlock timestamp must be calculated and stored server-side.

IMPORTANT:

- Never trust the user's local system clock.
- Never use only "Date.now()" on the client to determine access.
- Never expose sealed content to the browser before unlocking.
- Never rely only on hiding UI elements.
- Never send locked content to the client and hide it with CSS.
- Firestore Security Rules must prevent unauthorized reads.
- Firebase Storage Rules must prevent unauthorized access to sealed files.
- Server-side validation must be performed before revealing protected content.

Use Firebase server timestamps / trusted server time wherever appropriate.

The timezone must always be explicitly handled using:

Asia/Manila

Avoid timezone bugs caused by browser locale differences.

---

3. SECURITY ARCHITECTURE

Implement:

- Firebase Authentication
- Firestore Security Rules
- Firebase Storage Security Rules
- Firebase App Check where supported
- Role-based access control
- Server-side unlock validation
- Input validation
- File validation
- Rate limiting strategy
- Secure environment variables
- No Firebase admin credentials in the client
- No secrets committed to Git
- ".env.example"

Roles:

ADMIN
FAMILY
RECIPIENT

Define exactly what each role can do.

ADMIN:

- Manage capsule configuration
- Manage users
- Manage family members
- View system status
- Manage memories
- Manage unlock configuration

FAMILY:

- Create family messages
- Upload approved photos/audio
- View their own contributions
- Cannot access sealed recipient content

RECIPIENT:

- Create personal memories
- View her own allowed content
- Cannot access family sealed messages before unlock

Before unlock:

- Protected memory content must remain inaccessible.

After unlock:

- Authorized users can access the appropriate content.

---

4. FIRESTORE DATA MODEL

Design and implement a clear Firestore schema.

Recommended structure:

users/{userId}

capsules/{capsuleId}

capsules/{capsuleId}/memories/{memoryId}

capsules/{capsuleId}/familyMessages/{messageId}

capsules/{capsuleId}/settings/config

capsules/{capsuleId}/auditLogs/{logId}

Each memory should support fields such as:

id
capsuleId
authorId
authorRole
type
title
content
caption
tags
createdAt
updatedAt
unlockAt
isLocked
status
storagePaths
metadata

Do not duplicate sensitive information unnecessarily.

Use Firestore converters/types where appropriate.

Create indexes if required.

---

5. STORAGE ARCHITECTURE

Implement Firebase Storage for:

- Photos
- Voice notes

Use predictable but secure paths.

Example:

capsules/{capsuleId}/memories/{memoryId}/photos/{fileId}

capsules/{capsuleId}/memories/{memoryId}/audio/{fileId}

Implement:

- File type validation
- File size limits
- Upload progress
- Retry handling
- Cancel upload
- Delete file
- Error states
- Empty states
- Preview
- Image compression where appropriate
- Audio metadata
- Orphan file cleanup strategy

Allowed image types:

JPEG
PNG
WEBP
HEIC if supported safely

Allowed audio types should be explicitly configured.

Do NOT allow arbitrary executable files.

---

6. AUTHENTICATION

Use Firebase Authentication.

Support a clean authentication flow.

Possible providers:

- Email/password
- Google authentication if appropriate

Do not implement authentication using only frontend state.

Persist authenticated user state securely.

Create protected routes.

Handle:

- Loading
- Unauthorized
- Session expiration
- Sign out
- Permission denied
- Firebase errors

---

7. DESIGN SYSTEM

Design style:

Ultra-modern Korean/K-Pop aesthetic.

Visual language:

- Glassmorphism
- Lilac
- Lavender
- Soft Pink
- Deep Midnight Navy
- Dark mode
- Neon glow
- Soft gradients
- Large rounded cards
- Premium typography
- Subtle stars
- Floating particles
- Ambient lighting

The design should feel:

- Magical
- Premium
- Emotional
- Youthful
- Warm
- Modern
- Elegant

Avoid making it childish.

Use subtle Filipino/Gen-Z cultural touches such as:

"Slay"
"Vibes"
"Kakaiba"

These should remain subtle and tasteful.

---

8. MOBILE FIRST

Optimize primarily for:

iPhone
Android phones
Tablet
Desktop

Requirements:

- Touch-friendly controls
- Safe-area support
- Responsive typography
- Responsive cards
- Bottom navigation on mobile where appropriate
- Avoid hover-only interactions
- Accessible tap targets
- Smooth scrolling
- Optimized image loading

---

9. ANIMATION SYSTEM

Use Framer Motion.

Implement:

- Page transitions
- Card entrance animations
- Hover effects
- Press interactions
- Floating particles
- Glowing lock
- Countdown animation
- Modal transitions
- Toast animations
- Upload progress animations
- Celebration animations

Respect:

prefers-reduced-motion

If reduced motion is enabled, significantly reduce animation.

Do not overuse animations to the point that they hurt performance.

---

10. MAIN DASHBOARD

Create a beautiful dashboard containing:

Hero section

Digital Vault

Countdown

Lock status

Unlock date

Quick actions:

Deposit Memory
Family Corner
Preview Vault

Show:

- Number of memories
- Number of photos
- Number of voice notes
- Days remaining
- Recent activity

Do not expose sealed content.

---

11. DIGITAL VAULT

Create a premium vault interface.

Locked state:

🔒 LOCKED

Show:

- Animated lock
- Countdown
- Unlock date
- Progress indicator
- Ambient background
- Floating particles

When clicking locked content:

Play a subtle sound/haptic feedback where supported.

Show:

"Nice try! The vault is still sealed. 😉✨"

Do not reveal protected content.

---

12. COUNTDOWN

Implement a real-time countdown:

Days
Hours
Minutes
Seconds

The countdown must be calculated from trusted server time.

The UI may update every second, but the initial reference time must come from the server.

Handle:

- Device clock changes
- Browser tab suspension
- Network reconnection
- Page refresh
- Timezone differences

When the unlock moment arrives:

Automatically transition to:

VAULT UNLOCKED

Trigger:

- Confetti
- Fireworks
- Celebration animation
- Special welcome screen

Do not require a manual refresh.

---

13. DEPOSIT MEMORY

Create a beautiful memory creation flow.

Step 1:

Choose memory type:

Letter
Photo
Voice
Vibe Check
Special Memory

Step 2:

Enter content.

Letter fields:

Title
Message
Mood
Tags

Step 3:

Upload media if applicable.

Step 4:

Preview.

Step 5:

Confirm.

Step 6:

Save.

After successful submission:

- Show success animation
- Trigger confetti
- Show confirmation toast
- Return to dashboard

Use optimistic UI only where safe.

---

14. CURRENT VIBE CHECK

Create an interactive "Current Vibe Check 2026".

Fields:

Favorite Spotify song
Favorite K-Pop artist
Favorite Anime
Favorite celebrity
Best friends
Favorite food
Favorite color
Current aesthetic
Current mood
Favorite quote
Current dream
What I love right now
What I want to change
What I hope my future self remembers

Use beautiful interactive controls rather than boring forms.

---

15. PHOTO MEMORY

Create a modern drag-and-drop uploader.

Support:

- Multiple photos
- Preview
- Reordering
- Caption
- Tags
- Delete
- Upload progress
- Retry
- Compression

Use responsive gallery previews.

---

16. VOICE MEMORY

Allow short voice recordings.

Features:

- Record
- Pause
- Resume
- Stop
- Playback
- Delete
- Upload

Show:

Recording duration
Waveform visualization
Upload progress

Validate maximum recording duration.

Handle browsers that do not support MediaRecorder.

---

17. FAMILY CORNER

Create a dedicated Family Corner.

Family members can create:

- Birthday messages
- Letters
- Photo memories
- Voice messages
- Wishes
- Advice for her future self

All family content remains sealed until the configured unlock time.

Family members must only be able to manage their own contributions unless ADMIN permissions explicitly allow otherwise.

---

18. PREVIEW VAULT

Before unlocking, show a teaser version.

For example:

🔒 12 Letters
🔒 24 Photos
🔒 4 Voice Memories
🔒 7 Family Messages

Use:

- Blurred thumbnails
- Closed envelopes
- Locked cards
- Mystery titles

CRITICAL:

Do not send the actual protected content to the browser.

Only expose safe metadata/counts that are explicitly allowed.

---

19. CELEBRATION MODE

When the vault unlocks:

Create a full-screen celebration experience.

Include:

- Confetti
- Fireworks
- Glowing gradients
- Animated message
- Personalized welcome
- "Welcome to your 18th birthday vault"

Add a beautiful transition from:

LOCKED → UNLOCKING → UNLOCKED

Ensure the celebration does not block accessibility or normal navigation.

---

20. ACCESSIBILITY

Implement:

WCAG-conscious accessibility.

Requirements:

- Keyboard navigation
- Focus states
- Semantic HTML
- ARIA labels where necessary
- Screen reader support
- Sufficient color contrast
- Reduced motion support
- Accessible dialogs
- Accessible form errors
- Accessible upload controls

---

21. ERROR HANDLING

Every important async operation must have:

Loading state
Success state
Error state
Retry option
Empty state

Handle:

- Firebase unavailable
- Network disconnected
- Upload failure
- Authentication failure
- Permission denied
- Invalid files
- Expired session
- Firestore errors

Never show raw Firebase errors directly to users.

Create friendly user-facing error messages.

---

22. PERFORMANCE

Optimize for mobile.

Use:

- Next.js Server Components where appropriate
- Client Components only when necessary
- Lazy loading
- Image optimization
- Dynamic imports for heavy animation libraries
- Pagination where required
- Firestore query limits
- Efficient listeners
- Avoid unnecessary realtime subscriptions

Do not download all memories on initial page load.

---

23. SEO / METADATA

Create proper:

- Metadata
- Open Graph
- Twitter metadata
- Favicon
- Apple touch icon
- Manifest

Even though this is a private app, implement clean metadata and PWA-friendly configuration where appropriate.

---

24. PWA

If appropriate, implement:

- Web App Manifest
- Installable experience
- App icons
- Splash screen
- Mobile viewport optimization

Do not cache sensitive sealed content in an insecure way.

---

25. AUDIT LOG

Create audit logging for important events:

Login
Logout
Memory created
Memory updated
Memory deleted
File uploaded
File deleted
Permission denied
Vault unlocked
Configuration changed

Do not log sensitive memory content.

---

26. ADMIN SETTINGS

Create an admin-only configuration screen.

Allow ADMIN to configure:

Recipient name
Birth date
Timezone
Unlock time
Capsule title
Theme
Welcome message
Family members
Allowed file sizes
Recording duration
Capsule status

IMPORTANT:

Changing the unlock date must be heavily protected.

Never allow the recipient to modify it.

Log every unlock-date modification.

---

27. SECURITY RULES

Create production-ready Firestore Rules.

Create production-ready Storage Rules.

Rules must enforce:

Authentication
Role permissions
Capsule ownership
Memory ownership
Family permissions
Unlock restrictions
File ownership
File size/type restrictions where supported

Never rely only on React route protection.

The security rules must remain secure even if a malicious user directly calls Firebase APIs.

---

28. FIREBASE APP CHECK

Configure Firebase App Check where applicable.

Document setup requirements.

Do not hardcode credentials.

Use:

NEXT_PUBLIC_FIREBASE_...

for client-safe configuration.

Never expose:

Firebase Admin private keys
service account credentials
server secrets

---

29. ENVIRONMENT CONFIGURATION

Create:

.env.example

Document every required variable.

Do not commit ".env.local".

Create a clear Firebase setup guide.

---

30. PROJECT STRUCTURE

Use a clean architecture such as:

app/
components/
components/ui/
components/vault/
components/memories/
components/family/
components/dashboard/
components/upload/
hooks/
lib/
lib/firebase/
lib/auth/
lib/security/
lib/time/
lib/storage/
lib/validation/
types/
services/
constants/
styles/

Do not create unnecessary abstractions.

Keep components small and reusable.

---

31. VALIDATION

Use a proper validation library such as Zod where appropriate.

Validate:

Forms
Dates
File metadata
Memory types
User input
Configuration

Never trust client-side validation alone.

---

32. TESTING

Implement tests for critical business logic.

At minimum test:

- Unlock calculation
- Timezone conversion
- Locked state
- Unlocked state
- Boundary time
- Permission checks
- File validation
- Memory creation
- Family permissions

Also provide a testing strategy for Firebase Rules.

Test the exact moment before and after unlock.

Example:

23:59:59 → LOCKED

00:00:00 → UNLOCKED

using Asia/Manila.

---

33. DATABASE SAFETY

Do not accidentally overwrite existing Firestore data.

Use safe migrations where needed.

Do not delete existing collections without explicit justification.

Document schema changes.

---

34. DEPLOYMENT

Prepare the application for production deployment.

Include:

Firebase configuration
Firestore rules
Storage rules
Indexes
Environment configuration
Build configuration
Deployment instructions

Ensure:

npm run build

works successfully.

Fix all build errors before considering the implementation complete.

---

35. CODE QUALITY

Use:

TypeScript strict mode where possible.

Avoid:

any
unused variables
dead code
duplicated logic
hardcoded secrets
hardcoded dates
massive components
business logic inside JSX

Keep business logic separate from presentation.

---

36. FINAL VERIFICATION

Before finishing:

1. Run lint.
2. Run type checking.
3. Run tests.
4. Run production build.
5. Verify Firebase configuration.
6. Verify Firestore Rules.
7. Verify Storage Rules.
8. Verify authentication.
9. Verify upload flow.
10. Verify locked state.
11. Verify unlocked state.
12. Verify timezone behavior.
13. Verify mobile layout.
14. Verify desktop layout.
15. Verify reduced-motion behavior.
16. Verify network failure states.
17. Verify unauthorized Firebase API access.
18. Verify that sealed content is never exposed before unlock.

Do not claim the application is production-ready unless these checks pass.

---

37. IMPLEMENTATION PROCESS

Follow this exact order:

PHASE 1:
Analyze the existing project.

PHASE 2:
Create an architecture plan.

PHASE 3:
Create/update types and data models.

PHASE 4:
Implement Firebase authentication and security.

PHASE 5:
Implement server-side time/unlock architecture.

PHASE 6:
Implement Firestore and Storage.

PHASE 7:
Implement dashboard and vault UI.

PHASE 8:
Implement memory system.

PHASE 9:
Implement Family Corner.

PHASE 10:
Implement uploads and voice recording.

PHASE 11:
Implement celebration/unlock experience.

PHASE 12:
Implement admin settings.

PHASE 13:
Implement accessibility and performance optimization.

PHASE 14:
Implement tests.

PHASE 15:
Run complete production verification.

At every phase:

- Inspect before changing.
- Make minimal safe changes.
- Reuse existing code.
- Avoid breaking existing functionality.
- Run appropriate checks.
- Fix errors immediately.
- Do not move to the next phase if the current phase is broken.

---

FINAL OUTPUT

After implementation, provide:

1. Summary of what was implemented.
2. Complete list of modified/created files.
3. Firebase setup instructions.
4. Environment variables required.
5. Firestore schema.
6. Security Rules explanation.
7. Storage Rules explanation.
8. Authentication setup.
9. Deployment instructions.
10. Testing instructions.
11. Any remaining limitations or manual configuration steps.

MOST IMPORTANT SECURITY REQUIREMENT:

The application must treat the frontend as untrusted.

The fact that the UI displays "LOCKED" is NOT security.

A user must not be able to access sealed letters, photos, audio, or family messages by:

- Changing system time
- Changing browser time
- Inspecting React state
- Calling Firestore directly
- Calling Firebase Storage directly
- Manipulating URL parameters
- Opening API requests manually
- Modifying local storage
- Editing cookies
- Bypassing frontend routes

The actual authorization decision must be enforced server-side and through Firebase Security Rules.