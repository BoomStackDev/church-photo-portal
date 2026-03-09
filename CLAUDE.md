
```markdown
# CLAUDE.md — Church Volunteer Photo Portal

## Project Summary
A PIN-protected web portal for church volunteers to submit photos and videos
directly to a OneDrive folder. No database. Volunteer uploads use a shared PIN. Admin gallery uses Microsoft OAuth — tpob.org accounts only.
Built with Next.js 15, TypeScript, Tailwind CSS, deployed on Vercel.

---

## Tech Stack — Do Not Deviate Without Discussing First

| Technology | Decision |
|------------|----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript — strict mode, no `any` types |
| Styling | Tailwind CSS utility classes only — no inline styles, no CSS modules |
| File Storage | Microsoft OneDrive via Microsoft Graph API |
| Auth | Single shared PIN stored in environment variable — no user accounts |
| Hosting | Vercel — auto-deploy from main branch |
| Package Manager | pnpm only — never npm |
| State Management | useState for local UI state only — no Redux, no Zustand |

---

## Folder Structure

```
app/
  page.tsx                  ← PIN entry page (the only route)
  upload/
    page.tsx                ← Upload form (only reachable after correct PIN)
  admin/
    page.tsx                ← Admin gallery (requires Microsoft login)
  api/
    upload/
      route.ts              ← Server-side: receives files, calls OneDrive
    auth/
      [...nextauth]/
        route.ts            ← NextAuth.js OAuth handler
      files/
        route.ts            ← Fetches file list from OneDrive for admin view
  lib/
    onedrive.ts             ← ALL Microsoft Graph API calls live here only
    auth.ts                 ← PIN verification lives here only
    format-filename.ts      ← File naming logic lives here only
  types/
    index.ts                ← All TypeScript interfaces
  components/
    UploadForm.tsx
    PinEntry.tsx
    SuccessMessage.tsx
    ErrorMessage.tsx
```

---

## Non-Negotiable Rules

- Always run `pnpm run build` after every change. If the build fails, fix it before stopping.
- Never use npm. Always pnpm.
- No `any` TypeScript types. Ask if you're not sure what type to use.
- Never call the Microsoft Graph API directly from a component. All OneDrive calls go through `lib/onedrive.ts`.
- Never hardcode the PIN. It lives in the `UPLOAD_PIN` environment variable only.
- Never hardcode the OneDrive folder path. It lives in the `ONEDRIVE_FOLDER_PATH` environment variable.
- Never hardcode Microsoft credentials. They live in environment variables only:
  - `AZURE_CLIENT_ID`
  - `AZURE_CLIENT_SECRET`
  - `AZURE_TENANT_ID`
  - `ONEDRIVE_USER_ID` (the Microsoft account that owns the OneDrive)
  - `UPLOAD_PIN`
  - `ONEDRIVE_FOLDER_PATH`
- Loading states, error states, empty states, and success states are required on the upload form — not optional.
- Read and report before you write. Always run Search and Report before making any changes.
- Define the Zod schema for the upload form before building the form UI.

---

## Key Architecture Decision: Files Go Server-Side

Files must NOT be uploaded from the browser directly to OneDrive.
The flow is:
  1. Volunteer submits form in browser
  2. Browser sends files to our Next.js API route (`/api/upload`)
  3. API route authenticates with Microsoft Graph using client credentials
  4. API route uploads each file to OneDrive
  5. API route returns success/failure to browser

This keeps our Azure credentials server-side and never exposed to the browser.

---

## Microsoft Graph API — Key Details

- Auth method: Client Credentials flow (app-level, not user-level)
- Required permission: `Files.ReadWrite.All` (application permission, not delegated)
- Upload endpoint for small files (<4MB): `PUT /users/{userId}/drive/root:/{folderPath}/{filename}:/content`
- Upload endpoint for large files (>4MB): Use upload session API
- Token endpoint: `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token`

---

## TypeScript Interfaces

```typescript
// types/index.ts

export interface SubmissionForm {
  volunteerName: string;
  caption: string;
  files: File[];
}

export interface UploadResult {
  success: boolean;
  uploadedFiles: string[];
  failedFiles: string[];
  error?: string;
}
```

---

## Zod Schema (define before building the form)

```typescript
import { z } from 'zod';

export const submissionSchema = z.object({
  volunteerName: z.string().min(1, 'Name is required').max(100),
  caption: z.string().min(1, 'Caption is required').max(500),
});
```

File validation (type and size) is handled separately on the API route.

---

## Commit Pattern

```bash
git add -A
git commit -m "feat: description of what changed"
git checkout main
git merge dev
git push origin main
git checkout dev
```

---

## Known Risk Areas

| Risk | Prevention |
|------|------------|
| Azure credentials exposed client-side | All Graph API calls in API route only — never in components |
| Large video files timing out on Vercel | Use Graph upload session for files >4MB. Vercel free tier has 10s limit — upgrade if needed |
| Wrong PIN letting someone through | PIN check must happen server-side on the API route, not just client-side |
| Files overwriting each other | Always include timestamp in filename — never allow two files to have the same name |
```

---

# SECTION 5 — LOOP-BREAKING PROTOCOL

If Claude Code makes the same mistake twice, stop immediately.

**Stop signs:**
- The same error appears twice in a row
- Claude Code starts apologising ("I apologise for the oversight...")
- Claude Code suggests something it already tried
- You've made 3 fixes and the build is still failing

**What to do:**

Circuit Breaker 1 — paste this into Claude Chat:
```
Do not write any code yet.
Analyse the last two errors I received.
Explain why they happened and why the previous fix failed.
Once I approve your analysis, propose a new approach.
```

Circuit Breaker 2 — fresh start:
1. Run `git checkout .` to discard failed changes
2. Open a new Claude Code session
3. Describe the goal cleanly with no history of failed attempts

---

# SECTION 6 — LAUNCH CHECKLIST

Before sharing the URL with any volunteers:

- [ ] All environment variables set in Vercel (Azure credentials, PIN, folder path)
- [ ] Test upload from a real phone — photos and videos land in OneDrive correctly
- [ ] Test wrong PIN — confirms access is blocked
- [ ] Test with a large video file (>4MB) — upload session works
- [ ] Error message shows if upload fails (network drop, etc.)
- [ ] Success message shows after upload completes
- [ ] File names are unique — include timestamp so nothing gets overwritten
- [ ] Azure app has only the permissions it needs (`Files.ReadWrite.All`) — nothing extra
- [ ] PIN is not written down anywhere in the code — only in Vercel environment variables

---

*This document is your source of truth. Update it when decisions change.*
*Created March 2026 — Church Volunteer Photo Portal*