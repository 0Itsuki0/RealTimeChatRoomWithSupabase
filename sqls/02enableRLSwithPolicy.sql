---------------------
-- ChatRoom Master --
---------------------

-- enable RLS
alter table chatroom_master
enable row level security;

-- add actual policy
create policy "master are viewable by everyone"
on chatroom_master for select
to authenticated, anon -- the Postgres Role (recommended)
using ( true ); -- the actual Policy

create policy "master are insertable by authenticated users"
on chatroom_master for insert
to authenticated
with check ( (select auth.uid()) = created_by ); -- the actual Policy

create policy "Users can update chat master they create."
on chatroom_master for update
to authenticated                    -- the Postgres Role (recommended)
using ( (select auth.uid()) = created_by )       -- checks if the existing row complies with the policy expression
with check ( (select auth.uid()) = created_by ); -- checks if the new row complies with the policy expression

create policy "Users can delete chat master they create."
on chatroom_master for delete
to authenticated                    -- the Postgres Role (recommended)
using ( (select auth.uid()) = created_by ); -- checks if the new row complies with the policy expression

-- add indices for better performance
create index room_created_by_user_index
on chatroom_master
using btree (created_by);


---------------------
---- Chat history ---
---------------------
alter table chat_history
enable row level security;

create policy "chat_history viewable by authenticated users"
on chat_history for select
to authenticated
using ( true );

create policy "history are insertable by authenticated users"
on chat_history for insert
to authenticated
with check ( (select auth.uid()) = created_by ); -- the actual Policy

create index history_created_by_user_index
on chat_history
using btree (created_by);