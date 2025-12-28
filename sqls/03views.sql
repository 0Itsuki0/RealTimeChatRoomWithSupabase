-- one view for each table so that we can query data from multiple schemas.
drop view if exists chatroom_profile;

create view chatroom_profile as
select
  cm.created_at,
  cm.created_by,
  cm.id,
  cm.name,
  au.email
from
  public.chatroom_master as cm
inner join auth.users as au on cm.created_by = au.id;


drop view if exists chat_history_profile;

create view chat_history_profile as
select
  ch.*,
  au.email as created_by_email,
  cm.name as room_name
from
  public.chat_history as ch
inner join auth.users as au on ch.created_by = au.id
inner join chatroom_master as cm on ch.room = cm.id;
