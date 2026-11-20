-- Agreement to the Terms of Service and Privacy Policy, consent records for the
-- AI host, and reports about other attendees.

alter table connect.users add column if not exists terms_version text not null default '';
alter table connect.users add column if not exists terms_accepted_at bigint;

-- Every agreement and withdrawal, kept as its own row. Nuance Labs requires us to
-- keep records of consent to its processing, so these rows outlive an account:
-- user_id becomes null when the account is deleted, and `subject` (the same
-- non-identifying code sent to Nuance as end_user_id) remains.
create table if not exists connect.consent_records (
  id serial primary key,
  user_id integer references connect.users(id) on delete set null,
  subject text not null,
  kind text not null check (kind in ('terms', 'host', 'host_withdrawn')),
  version text not null,
  created_at bigint not null
);
create index if not exists consent_records_user_idx on connect.consent_records (user_id, kind, created_at);

-- Which consent text was in force for each AI host call.
alter table connect.host_calls add column if not exists consent_version text not null default '';

-- Reports about another attendee. Reviewed by the owners in Supabase.
create table if not exists connect.reports (
  id serial primary key,
  reporter_id integer references connect.users(id) on delete set null,
  reported_user_id integer references connect.users(id) on delete set null,
  reported_name text not null default '',
  reason text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'reviewed', 'closed')),
  created_at bigint not null
);
create index if not exists reports_status_idx on connect.reports (status, created_at);

alter table connect.consent_records enable row level security;
alter table connect.reports enable row level security;
revoke all on connect.consent_records from anon, authenticated;
revoke all on connect.reports from anon, authenticated;
