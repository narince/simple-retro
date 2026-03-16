-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS (Was profiles)
create table if not exists users (
  id text primary key, -- Keeping as text to match application UUIDs
  email text not null unique,
  full_name text,
  avatar_url text,
  password_hash text,
  role text default 'user',
  last_login_at timestamp with time zone,
  last_logout_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- BOARDS
create table if not exists boards (
  id text primary key,
  team_id text default 'default-team',
  title text not null,
  created_by text references users(id),
  owner_id text references users(id),
  is_locked boolean default false,
  are_votes_hidden boolean default false,
  max_votes integer,
  column_colors text[], -- Stored as array of strings
  is_gifs_enabled boolean default true,
  is_reactions_enabled boolean default true,
  is_comments_enabled boolean default true,
  are_cards_hidden boolean default false,
  is_voting_disabled boolean default false,
  password_hash text,
  created_at timestamp with time zone default now(),
  allowed_user_ids text[] -- Array of user IDs
);

-- COLUMNS
create table if not exists columns (
  id text primary key,
  board_id text references boards(id) on delete cascade not null,
  title text not null,
  color text default '#10B981',
  order_index integer not null,
  created_at timestamp with time zone default now()
);

-- CARDS
create table if not exists cards (
  id text primary key,
  column_id text references columns(id) on delete cascade not null,
  content text not null,
  author_id text, -- Nullable for anonymous
  author_full_name text,
  author_avatar_url text,
  is_anonymous boolean default false,
  votes integer default 0,
  voted_user_ids text[], -- Array of user IDs
  color text,
  order_index integer default 0,
  comments jsonb default '[]'::jsonb, -- Added missing comments field too as per Types
  created_at timestamp with time zone default now()
);

-- COMMENTS
create table if not exists comments (
  id text primary key,
  card_id text references cards(id) on delete cascade not null,
  text text not null,
  author_id text not null,
  created_at timestamp with time zone default now()
);

-- REACTIONS
create table if not exists reactions (
  id text primary key,
  board_id text references boards(id) on delete cascade not null,
  emoji text not null,
  user_id text,
  created_at timestamp with time zone default now()
);

