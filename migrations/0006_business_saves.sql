-- Businesses an attendee saved from the Black-owned business directory.
-- The businesses themselves live in shared/businesses.json; `slug` points at one.
create table if not exists connect.business_saves (
  id serial primary key,
  user_id integer not null references connect.users(id) on delete cascade,
  slug text not null,
  created_at bigint not null
);
create unique index if not exists business_saves_user_slug_idx on connect.business_saves (user_id, slug);
alter table connect.business_saves enable row level security;
revoke all on connect.business_saves from anon, authenticated;
