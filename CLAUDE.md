# PowerUp Connect — notes for Claude

Networking app prototype for the Power Up Women's Conference (March 2027).
Full product spec: powerup_connect_spec.md. Branding: BRANDING.md (matches the Power Up Women's Conference website). Build/QA notes: powerup_connect_final_report.md.

## Stack
Express + Vite + React + Tailwind + shadcn/ui + Drizzle ORM (Postgres on Supabase via postgres-js).
- Hosting: Netlify. Screens are static; the API is one Netlify Function (netlify/functions/api.ts wrapping server/app.ts). See DEPLOY.md.
- Database: Supabase project "power-up", schema `connect`; needs DATABASE_URL (see .env.example). On Netlify, server/db.ts opens a new connection whenever the last one has been unused for 8 seconds (a connection that sat through a function freeze can hang), and server/app.ts answers 503 and resets the connections if any request takes 20 seconds.
- Data model: shared/schema.ts. Conference years, the five "I'm here for" interests and the All-Star / Legend badge rule live in shared/event.ts (no database imports, safe for the browser).
- Profile photos: resized in the browser, stored in connect.user_photos, served from /api/photos/<random key>.
- Connections need consent: connect.connection_requests holds one row per direction (pending | accepted | declined). Two women are connected once a row between them is accepted. A declined request is kept and still reads as "request sent" to the sender, so she is not told and cannot ask again. Asking someone who already asked you connects straight away. 40 new requests per account per day. Private notes stay in connect.connections and need an accepted connection.
- Messaging: only between connected women (POST /api/messages/:id returns 403 otherwise). Old threads stay readable.
- Privacy: other attendees never receive an access code. They receive a phone number or email address only when its owner turned that switch on (phone_visible, email_visible) AND has accepted them as a connection (toAttendeeView in server/routes.ts).
- AI host "Nia": a live video persona from Nuance Labs (docs.nuancelabs.ai, SDK @nuancelabs/js-sdk). server/host.ts builds her prompt from the attendee's first name, interests and past-conference count plus the published sessions, and mints a single-use session token with NUANCE_API_KEY (Netlify secret; unset = host hidden). Routes: GET /api/host/status, POST /api/host/token. Page: client/src/pages/host.tsx (lazy-loaded, voice only, camera off, 5-minute calls). Limits: 4 calls an hour and 10 a day per attendee, counted in connect.host_calls. NUANCE_PERSONA_ID picks the face: sam, sonia (default) or mira. To change what she knows or how she talks, edit buildHostPrompt.
- Business directory (Businesses tab): Black-owned businesses in Northern Virginia. The source list is data/black-owned-businesses-nova.md; `node scripts/import-businesses.mjs` turns it into shared/businesses.json (category, area, cleaned phone and website). GET /api/businesses serves it to signed-in attendees, leaving out any entry with a "Verify" note in the list (needsCheck). Hearts are saved per attendee in connect.business_saves by slug. Page: client/src/pages/businesses.tsx. To add, fix or un-hide a business, edit the .md file, re-run the script and deploy.
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
