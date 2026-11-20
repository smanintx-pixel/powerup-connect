-- Connection requests: a woman must accept before someone counts as her
-- connection. Messaging and any contact details she chose to show are limited
-- to accepted connections. Also adds the "show my email" switch.

alter table connect.users add column if not exists email_visible boolean not null default false;

create table if not exists connect.connection_requests (
  id serial primary key,
  from_user_id integer not null references connect.users(id) on delete cascade,
  to_user_id integer not null references connect.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at bigint not null,
  responded_at bigint,
  check (from_user_id <> to_user_id)
);
create unique index if not exists connection_requests_pair_idx
  on connect.connection_requests (from_user_id, to_user_id);
create index if not exists connection_requests_to_idx
  on connect.connection_requests (to_user_id, status);

alter table connect.connection_requests enable row level security;
revoke all on connect.connection_requests from anon, authenticated;

-- Connections saved before this change were one-sided. Each becomes a pending
-- request, so the other woman gets to decide. If both had saved each other,
-- they are connected straight away.
insert into connect.connection_requests (from_user_id, to_user_id, status, created_at)
select c.user_id, c.connected_user_id, 'pending', c.created_at
from connect.connections c
where c.user_id <> c.connected_user_id
on conflict do nothing;

update connect.connection_requests r
set status = 'accepted', responded_at = r.created_at
where r.status = 'pending'
  and exists (
    select 1 from connect.connection_requests o
    where o.from_user_id = r.to_user_id and o.to_user_id = r.from_user_id
  );
