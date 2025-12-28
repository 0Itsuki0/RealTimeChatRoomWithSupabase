# RealTime ChatRoom with Supabase

A real time chatroom app with
- backend implemented using supabase
  - database
  - Authentication
  - Real time API
- frontend with Vite and React.

For more details, please refer to my blog [Supabase From Super Base! With a Real Time ChatRoom App!](https://medium.com/@itsuki.enjoy/supabase-from-super-base-with-a-real-time-chatroom-app-21ce7c552ae8)

## Set Up
1. Go to [database.new](https://database.new/) and click on that New project button to create a new Supabase project.
2. Run the following to set up database tables and real time api
  - [Create table](./sqls/01createtable.sql)
  - [Enable RLS and Create Policies](./sqls/02enableRLSwithPolicy.sql)
  - [Create views for querying across multiple schema](./sqls/03views.sql)
  - [Set up real time API](./sqls/04realtime.sql)
3. Run `npm install` to install dependency
4. Create a `.env.local` with the following variables

```.env
VITE_SUPABASE_URL=https://your_project_id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxx
```

## Start App
1. Run `npm run dev` to start a local server listening to `http://localhost:5173`

## Demo
![](./demo.gif)