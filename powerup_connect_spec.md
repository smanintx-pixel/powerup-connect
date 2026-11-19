# PowerUp Connect — Build Spec

## What this is
A mobile-friendly web app prototype (installable as a home-screen app / PWA-style, works great on phones) for attendees of the **Power Up Women's Conference** (powerupwomensconference.com — a women's empowerment conference, theme "Your Next Power Move," tagline "Live with Purpose. Live with Passion. Live with Power."). Target event: **Power Up Women's Conference 2027 (March)**.

App name: **PowerUp Connect**

Purpose: let attendees build profiles, discover and "connect" with other women at the event, share LinkedIn links, take private notes about people they meet, and keep those connections + notes accessible year-round after the conference ends (not just during the event). Access is gated behind an access code that is bundled with conference registration (i.e. paying for a conference ticket gives you a code to unlock the app — model this as an access-code-gated signup, not real payment processing).

## Art direction
Updated November 2026 to match the new Power Up Women's Conference website. See BRANDING.md for the full token list.
- **Colours:** white surfaces and navy text (#0B1440), purple primary (#6A21C4), gold accent (#FFB81C), with brand red (#E0263C), green (#2E9E33) and blue (#1D8DF0) as supporting colours. Dark mode sits on the brand navy.
- **Type:** Outfit for headings (800 to 900 weight), Inter for body, Kaushan Script for short handwritten accents only.
- **Shape:** asymmetric corners (one tight, three generous), pill buttons, coloured rings and a wave edge under the hero. Avoid symmetrical grids of identical boxes.
- **Logo:** the Power Up power button, with "PowerUp Connect" set in Outfit.
- No stock or generated illustrations. Use the rings graphic or real event photos.

## Core user flows
1. **Landing page** — Brief hero explaining the app, its tie to the Power Up Women's Conference, and CTA to sign up / log in. Mention "Access included with your conference registration" and show a visible demo access code for testing (e.g. `POWERUP2027`).
2. **Sign up** — name, email, password, access code (required, validated against seeded codes table), optional title/company. On success, go to profile setup.
3. **Log in** — email + password.
4. **Profile setup/edit** — name, headshot photo URL (optional, fallback to generated initials avatar), title, company, one-line bio, LinkedIn URL, 2-3 interest/industry tags.
5. **Directory** — searchable/filterable grid of attendee cards (name, title/company, avatar, tags). Search by name/company/tag.
6. **Attendee profile view** — full profile, LinkedIn link (opens in new tab), a "Connect" action, and (once connected) a private notes textarea (autosaves) + an optional follow-up reminder date. Notes and reminder dates are private to the viewer only.
7. **My Connections** — list of everyone the user has connected with, each showing their note preview and reminder date, sortable by most recent or by upcoming reminder. This is the "maintain over the year" hub — make it feel durable/persistent, not event-limited.
8. **Messages** — simple inbox of conversations with connected attendees + a chat thread view (text messages only, polling-based is fine, no real-time infra needed).
9. **Recordings** — a page listing conference session titles (use themes from the real conference: "Live with Purpose," "Live with Passion," "Live with Power," a Trailblazer/Legacy Honoree panel, etc.) with a clear "Recordings will be posted here after the event" empty/coming-soon state per session — do NOT fabricate fake video URLs or claim real video content exists.
10. **Settings** — edit profile, log out, view access code / plan status.

## Data model (shared/schema.ts)
- `accessCodes`: id, code (unique), label (e.g. "PUWC2027 General Admission"), maxUses, useCount
- `users`: id, name, email (unique), passwordHash, title, company, bio, linkedinUrl, photoUrl, tags (JSON text array), accessCode, createdAt
- `connections`: id, userId (owner of the note), connectedUserId, note (text, private to userId), reminderDate (nullable), createdAt
- `messages`: id, senderId, receiverId, body, createdAt

Seed data: 1 access code (`POWERUP2027`, maxUses high) + ~10-12 realistic demo attendee profiles (diverse names/titles/companies/bios/tags relevant to women's professional networking — e.g. founder, VP of Marketing, financial advisor, career coach, nonprofit director) so the Directory and Connections flows are demoable immediately without requiring the user to create many accounts. Do not use any real people's names/photos — invent plausible fictional attendees, and use generated-initials avatars (no photo scraping).

## Technical requirements
- Use the fullstack webapp template (Express + Vite + React + Tailwind + shadcn/ui + Drizzle/SQLite) per `website-building/webapp` skill instructions.
- Use hash-based routing (`wouter` + `useHashLocation`) per the skill's mandatory pattern.
- No `localStorage`/`sessionStorage`/cookies — use backend session via a simple token stored in React context/state passed on each request (e.g., return a session token on login/signup, keep it in React state, and require it as a header/body param on protected API calls). Persist "logged in" state only for the duration of the browser tab — that's an acceptable prototype limitation, mention it nowhere to the end user, just accept it.
- Passwords: hash with Node's built-in `crypto` (e.g. sha256 + salt) — no need for bcrypt.
- Mobile-first responsive layout — most attendees will use this on their phones during the event. Bottom tab navigation (Directory / Connections / Messages / Recordings / Profile) works well on mobile; adapt to a sidebar on desktop widths.
- Replace all `red` placeholder tokens in `index.css` with the plum/gold palette described above, light + dark mode.
- Follow accessibility + performance standards from `shared/08-standards.md`.
- Add `data-testid` to every interactive/display element per template conventions.

## QA
Since this is a multi-page interactive app: use Playwright (per `shared/12-playwright-interactive.md`) to screenshot every page at desktop (1280px) and mobile (375px), verify no layout breakage, verify the signup → profile → directory → connect → note → connections → messages → recordings flow all work end to end with the seeded data, and verify dark mode on at least the landing and directory pages. Fix all visual/functional issues found before finishing.

## Deliverable
1. Build the full app in a new project directory under the workspace (suggest `powerup-connect/`).
2. `git init` and commit at each major milestone.
3. Call `deploy_website()` yourself (project path = the built `dist/public` after `npm run build`, with the backend server started via `start_server` on port 5000 per the skill's "Apps with backend" deployment steps) to produce a live preview link.
4. Report back: the project directory path, the deploy/preview URL, the demo access code, and 2-3 seeded demo login credentials (email/password) so the user can log in and click through immediately.
