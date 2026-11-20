-- PowerUp Connect: profile extras.
-- Past conferences attended (drives the All-Star and Legend badges), what she
-- is here for, an optional phone number she can choose to show, and uploaded
-- profile photos.

alter table connect.users add column if not exists phone text not null default '';
alter table connect.users add column if not exists phone_visible boolean not null default false;
alter table connect.users add column if not exists interests text not null default '[]';
alter table connect.users add column if not exists past_years text not null default '[]';

create table if not exists connect.user_photos (
  key text primary key,
  user_id integer not null unique references connect.users(id) on delete cascade,
  mime text not null,
  data text not null,
  created_at bigint not null
);

alter table connect.user_photos enable row level security;
revoke all on connect.user_photos from anon, authenticated;
