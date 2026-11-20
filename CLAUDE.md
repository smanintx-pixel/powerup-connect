# PowerUp Connect — notes for Claude

Networking app prototype for the Power Up Women's Conference (March 2027).
Full product spec: powerup_connect_spec.md. Branding: BRANDING.md (matches the Power Up Women's Conference website). Build/QA notes: powerup_connect_final_report.md.

## Stack
Express + Vite + React + Tailwind + shadcn/ui + Drizzle ORM (Postgres on Supabase via postgres-js).
- Hosting: Netlify. Screens are static; the API is one Netlify Function (netlify/functions/api.ts wrapping server/app.ts). See DEPLOY.md.
- Database: Supabase project "power-up", schema `connect`; needs DATABASE_URL (see .env.example).
- Data model: shared/schema.ts. Conference years, the five "I'm here for" interests and the All-Star / Legend badge rule live in shared/event.ts (no database imports, safe for the browser).
- Profile photos: resized in the browser, stored in connect.user_photos, served from /api/photos/<random key>.
- Privacy: other attendees never receive an email address or access code, and receive a phone number only when its owner turned "show on my profile" on (toAttendeeView in server/routes.ts).
- Sessions page: rows in connect.event_sessions (title, presenter, track, time_label, description, recording_url, sort_order, published) and connect.session_materials (session_id, title, kind = slides | handout | guide | link, url). There is no organizer screen yet; rows are added in Supabase. A YouTube recording_url plays inside the app; any other link opens in a new tab.
- API routes: server/routes.ts; storage layer: server/storage.ts
- Pages: client/src/pages; routing uses wouter hash routing (useHashLocation)

## Run
npm install
npm run dev        # dev server on port 5000 (needs DATABASE_URL)
npm run build && NODE_ENV=production node dist/index.cjs

## Demo data
Access code: POWERUP2027
Logins (password Powerup2027!): amara@brightpathventures.com, priya@lumenfinancial.com, sofia@risecoaching.co

## Known prototype limits
- Sign-in sessions are rows in connect.sessions (30 days); the token is kept in the browser's localStorage. No password reset or sign-in rate limiting yet.
- Access-code signup simulates "included with registration"; no real payment integration.
- Messaging is polling-based.
- Demo attendees in the database share a published password; remove them before launch.
