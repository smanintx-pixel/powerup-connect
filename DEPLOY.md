# Putting PowerUp Connect online (Netlify + Supabase)

The screens are served by Netlify. The API runs as one Netlify Function
(`netlify/functions/api.ts`). All data, including sign-ins, lives in the
Supabase project **power-up** (`kmrazemqyutovzngojfb`), in a schema named
`connect`.

## One-time setup

1. **Get the database connection string.** Supabase dashboard > power-up >
   **Connect** > *Transaction pooler* (port 6543). The project was created by
   Claude, so set a database password first: Project Settings > Database >
   *Reset database password*. Put that password into the string.
2. **Create the Netlify site.** Add new site > deploy this folder (drag and
   drop is not enough because of the function; connect a Git repo or run
   `npx netlify deploy --build --prod` from this folder).
   Build settings are read from `netlify.toml`.
3. **Add the secret.** Netlify > Site configuration > Environment variables:
   `DATABASE_URL` = the string from step 1. Then redeploy.
4. Open the site and sign in with a demo account, or sign up with the access
   code `POWERUP2027`.

## Before real attendees use it

- Remove the 12 demo attendees (they share a published password):
  `delete from connect.users where access_code = 'POWERUP2027' and email in (...)`
  or simply `truncate connect.users cascade;` before launch.
- Replace `POWERUP2027` with the real access code(s) in `connect.access_codes`.
- Add a "forgot password" flow (not built yet) and rate limiting on sign-in.

## Local development

    cp .env.example .env      # fill in DATABASE_URL
    npm install
    npm run dev               # http://localhost:5000
    npm run seed              # optional: demo code + attendees into an empty database

Schema lives in `shared/schema.ts`; the SQL that created it is
`migrations/0001_connect_init.sql`.
