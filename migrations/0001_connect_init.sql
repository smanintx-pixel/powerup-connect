-- PowerUp Connect: tables for the companion app.
-- They live in their own schema so they stay apart from ticketing tables and
-- are not reachable through Supabase's public data API. Row level security is
-- on with no policies: only the app's own server connection can read or write.

create schema if not exists connect;

create table if not exists connect.access_codes (
  id serial primary key,
  code text not null unique,
  label text not null,
  max_uses integer not null,
  use_count integer not null default 0
);

create table if not exists connect.users (
  id serial primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  title text not null default '',
  company text not null default '',
  bio text not null default '',
  linkedin_url text not null default '',
  photo_url text not null default '',
  tags text not null default '[]',
  access_code text not null,
  created_at bigint not null
);

create table if not exists connect.connections (
  id serial primary key,
  user_id integer not null references connect.users(id) on delete cascade,
  connected_user_id integer not null references connect.users(id) on delete cascade,
  note text not null default '',
  reminder_date text,
  created_at bigint not null
);
create unique index if not exists connections_owner_target_idx
  on connect.connections (user_id, connected_user_id);
create index if not exists connections_target_idx on connect.connections (connected_user_id);

create table if not exists connect.messages (
  id serial primary key,
  sender_id integer not null references connect.users(id) on delete cascade,
  receiver_id integer not null references connect.users(id) on delete cascade,
  body text not null,
  created_at bigint not null
);
create index if not exists messages_sender_idx on connect.messages (sender_id);
create index if not exists messages_receiver_idx on connect.messages (receiver_id);

create table if not exists connect.sessions (
  token_hash text primary key,
  user_id integer not null references connect.users(id) on delete cascade,
  created_at bigint not null,
  expires_at bigint not null
);
create index if not exists sessions_user_idx on connect.sessions (user_id);

alter table connect.access_codes enable row level security;
alter table connect.users enable row level security;
alter table connect.connections enable row level security;
alter table connect.messages enable row level security;
alter table connect.sessions enable row level security;

revoke all on schema connect from anon, authenticated;
revoke all on all tables in schema connect from anon, authenticated;
