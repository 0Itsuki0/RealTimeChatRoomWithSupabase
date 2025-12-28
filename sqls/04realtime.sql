-- Enable Postgres replication to use Realtime Postgres Changes feature to listen to DB changes in realtime
alter publication supabase_realtime
add table chat_history;

alter publication supabase_realtime
add table chatroom_master;