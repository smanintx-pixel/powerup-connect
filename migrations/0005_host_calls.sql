-- One row each time an attendee starts a call with the AI host. Used only to
-- cap how many calls one person can start, because each call spends credits.
create table if not exists connect.host_calls (
  id serial primary key,
  user_id integer not null references connect.users(id) on delete cascade,
  created_at bigint not null
);
create index if not exists host_calls_user_idx on connect.host_calls (user_id, created_at);
alter table connect.host_calls enable row level security;
revoke all on connect.host_calls from anon, authenticated;
