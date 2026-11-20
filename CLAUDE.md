# PowerUp Connect — notes for Claude

Networking app prototype for the Power Up Women's Conference (March 2027).
Full product spec: powerup_connect_spec.md. Branding: BRANDING.md (matches the Power Up Women's Conference website). Build/QA notes: powerup_connect_final_report.md.

## Stack
Express + Vite + React + Tailwind + shadcn/ui + Drizzle ORM (Postgres on Supabase via postgres-js).
- Hosting: Netlify. Screens are static; the API is one Netlify Function (netlify/functions/api.ts wrapping server/app.ts). See DEPLOY.md.
- Database: Supabase project "power-up", schema `connect`; needs DATABASE_URL (see .env.example).
- Data model: shared/schema.ts. Conference years, the five "I'm here for" interests and the All-Star / Legend badge rule live in shared/event.ts (no database imports, safe for the browser).
- Profile photos: resized in the browser, stored in connect.user_photos, served from /api/photos/<random key>.
- Connections need consent: connect.connection_requests holds one row per direction (pending | accepted | declined). Two women are connected once a row between them is accepted. A declined request is kept and still reads as "request sent" to the sender, so she is not told and cannot ask again. Asking someone who already asked you connects straight away. 40 new requests per account per day. Private notes stay in connect.connections and need an accepted connection.
- Messaging: only between connected women (POST /api/messages/:id returns 403 otherwise). Old threads stay readable.
- Privacy: other attendees never receive an access code. They receive a phone number or email address only when its owner turned that switch on (phone_visible, email_visible) AND has accepted them as a connection (toAttendeeView in server/routes.ts).
- Sessions page: rows in connect.event_sessions (title, presenter, track, time_label, description, recording_url, sort_order, published) and connect.session_materials (session_id, title, kind = slides | handout | guide | link, url). There is no organizer screen yet; rows are added in Supabase. A YouTube recording_url plays inside the app; any other link opens in a new tab.
- Home page motion: client/src/components/motion.tsx (Reveal, CountUp, BlurWords) plus the pu-* animation classes at the end of client/src/index.css. CSS only, no animation library; all of it sits inside a prefers-reduced-motion: no-preference block.
- API routes: server/routes.ts; storage layer: server/storage.ts
- Pages: client/src/pages; routing uses wouter hash routing (useHashLocation)

## Run
npm install
npm run dev        # dev server on port 5000 (needs DATABASE_URL)
npm run build && NODE_ENV=production node dist/index.cjs

## Demo data
Access code: POWERUP2027
Logins (password Powerup2027!): amara@brightpathventures.com, priya@lumenfinancial.com, sofia@risecoaching.co

The landing page sample cards and the 12 demo attendees are invented people. Their portraits (client/src/assets/sample-*.jpg, client/public/demo/*.jpg, served at /demo/<name>.jpg) are AI-generated, not real attendees. Demo attendees were renamed on 2026-11-19 but kept their sign-in emails, so the emails no longer match the names. In the live database, user 1 (amara@…) was personalised by the owners and is left alone.

## Known prototype limits
- Sign-in sessions are rows in connect.sessions (30 days); the token is kept in the browser's localStorage. No password reset or sign-in rate limiting yet.
- Access-code signup simulates "included with registration"; no real payment integration.
- Messaging is polling-based.
- Demo attendees in the database share a published password; remove them before launch.
