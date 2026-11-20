-- PowerUp Connect: the Sessions page.
-- Each session can carry a recording link and any number of materials
-- (slides, handouts, guides). Organizers fill these in as they become ready.

create table if not exists connect.event_sessions (
  id serial primary key,
  title text not null,
  presenter text not null default '',
  track text not null default '',
  time_label text not null default '',
  description text not null default '',
  recording_url text not null default '',
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists connect.session_materials (
  id serial primary key,
  session_id integer not null references connect.event_sessions(id) on delete cascade,
  title text not null,
  kind text not null default 'handout' check (kind in ('slides', 'handout', 'guide', 'link')),
  url text not null,
  sort_order integer not null default 0
);
create index if not exists session_materials_session_idx on connect.session_materials (session_id);

alter table connect.event_sessions enable row level security;
alter table connect.session_materials enable row level security;
revoke all on connect.event_sessions, connect.session_materials from anon, authenticated;
