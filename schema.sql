-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- TEAMS
create table teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table teams enable row level security;

-- MEMBERSHIPS
create table memberships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  team_id uuid references teams(id) not null,
  role text default 'member', -- owner, member
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, team_id)
);
alter table memberships enable row level security;

-- BOARDS
create table boards (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references teams(id) not null,
  title text not null,
  created_by uuid references profiles(id),
  is_locked boolean default false,
  are_votes_hidden boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table boards enable row level security;

-- COLUMNS
create table columns (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references boards(id) on delete cascade not null,
  title text not null,
  color text default '#10B981', -- default green
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table columns enable row level security;

-- CARDS
create table cards (
  id uuid default uuid_generate_v4() primary key,
  column_id uuid references columns(id) on delete cascade not null,
  content text not null,
  author_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table cards enable row level security;

-- VOTES
create table votes (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(card_id, user_id)
);
alter table votes enable row level security;

-- RLS POLICIES

-- Helper function to check team membership
create or replace function public.is_member_of(_team_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from memberships
    where team_id = _team_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- TEAMS Policies
create policy "Team members can view teams" on teams for select
using (exists (select 1 from memberships where team_id = teams.id and user_id = auth.uid()));

create policy "Users can create teams" on teams for insert
with check (true); 

-- MEMBERSHIPS Policies
create policy "Users can view memberships of their teams" on memberships for select
using (
  user_id = auth.uid() or 
  exists (select 1 from memberships m where m.team_id = memberships.team_id and m.user_id = auth.uid())
);

create policy "Mebers can join teams" on memberships for insert
with check (user_id = auth.uid()); -- Or simpler logic for MVP

-- BOARDS Policies
create policy "Team members can view boards" on boards for select
using (public.is_member_of(team_id));

create policy "Team members can create boards" on boards for insert
with check (public.is_member_of(team_id));

create policy "Team members can update boards" on boards for update
using (public.is_member_of(team_id));

create policy "Team members can delete boards" on boards for delete
using (public.is_member_of(team_id));

-- COLUMNS Policies
create policy "Team members can view columns" on columns for select
using (exists (
  select 1 from boards
  where boards.id = columns.board_id
  and public.is_member_of(boards.team_id)
));

-- CARDS Policies
create policy "Team members can view cards" on cards for select
using (exists (
  select 1 from columns
  join boards on boards.id = columns.board_id
  where columns.id = cards.column_id
  and public.is_member_of(boards.team_id)
));

create policy "Team members can insert cards" on cards for insert
with check (exists (
  select 1 from columns
  join boards on boards.id = columns.board_id
  where columns.id = cards.column_id
  and public.is_member_of(boards.team_id)
));

create policy "Team members can update cards" on cards for update
using (exists (
  select 1 from columns
  join boards on boards.id = columns.board_id
  where columns.id = cards.column_id
  and public.is_member_of(boards.team_id)
));

create policy "Team members can delete cards" on cards for delete
using (exists (
  select 1 from columns
  join boards on boards.id = columns.board_id
  where columns.id = cards.column_id
  and public.is_member_of(boards.team_id)
));

-- VOTES Policies
create policy "Team members can view votes" on votes for select
using (exists (
  select 1 from cards
  join columns on columns.id = cards.column_id
  join boards on boards.id = columns.board_id
  where cards.id = votes.card_id
  and public.is_member_of(boards.team_id)
));

create policy "Team members can add votes" on votes for insert
with check (exists (
  select 1 from cards
  join columns on columns.id = cards.column_id
  join boards on boards.id = columns.board_id
  where cards.id = votes.card_id
  and public.is_member_of(boards.team_id)
));

create policy "Team members can remove own votes" on votes for delete
using (user_id = auth.uid());

-- TRIGGER for new users -> auto create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
