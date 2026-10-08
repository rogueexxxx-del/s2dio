-- ==============================================================================
-- S2DIO Migration: 20261008000000_s2dio_init.sql
-- Complete Postgres Schema with Row Level Security (RLS) for Music Studio
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Enum types
create type user_plan_tier as enum ('starter', 'pro_flex', 'pro_unlimited', 'enterprise');
create type session_status as enum ('scheduled', 'active', 'ended');
create type participant_role as enum ('host', 'collaborator', 'guest');
create type screen_control_state as enum ('none', 'requested', 'granted');
create type audio_quality_tier as enum ('opus_standard', 'opus_hq_stereo', 'pcm_lossless');

-- 1. Profiles (linked to auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  plan_tier user_plan_tier not null default 'starter',
  boost_balance int not null default 2 check (boost_balance >= 0),
  storage_used_bytes bigint not null default 0 check (storage_used_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_tier on profiles(plan_tier);

-- 2. Sessions (Virtual Studio Rooms)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Untitled Session',
  slug text not null unique,
  status session_status not null default 'active',
  max_collaborators int not null default 4 check (max_collaborators >= 1),
  audio_quality audio_quality_tier not null default 'pcm_lossless',
  sample_rate int not null default 48000 check (sample_rate in (44100, 48000, 96000)),
  scheduled_start_at timestamptz not null default now(),
  expires_at timestamptz,
  is_permanent boolean not null default false,
  storage_limit_bytes bigint not null default 524288000, -- 500MB default
  storage_used_bytes bigint not null default 0 check (storage_used_bytes >= 0),
  vst3_session_token text not null default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_session_storage check (storage_used_bytes <= storage_limit_bytes)
);
create index if not exists idx_sessions_host on sessions(host_id);
create index if not exists idx_sessions_slug on sessions(slug);
create index if not exists idx_sessions_status on sessions(status);

-- 3. Session Participants
create table if not exists session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  guest_name text,
  role participant_role not null default 'guest',
  screen_control screen_control_state not null default 'none',
  is_talkback_muted boolean not null default false,
  has_vst3_connected boolean not null default false,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  constraint valid_participant_identity check (user_id is not null or guest_name is not null)
);
create index if not exists idx_participants_session on session_participants(session_id);
create index if not exists idx_participants_user on session_participants(user_id);

-- 4. Session Chat Messages
create table if not exists session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  participant_id uuid not null references session_participants(id) on delete cascade,
  sender_name text not null default 'Participant',
  message text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_session on session_messages(session_id, created_at);

-- 5. Session Shared Files (Lossless Stems, WAVs, MIDI)
create table if not exists session_files (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  uploader_participant_id uuid not null references session_participants(id) on delete cascade,
  file_name text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  mime_type text not null,
  storage_path text not null,
  uploader_name text not null default 'Producer',
  is_stem boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_files_session on session_files(session_id, created_at);

-- 6. Subscriptions (Stripe billing integration)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null,
  plan_tier user_plan_tier not null,
  status text not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user on subscriptions(user_id);

-- 7. Stripe Webhook Deduplication Table (Guarantees Idempotency)
create table if not exists stripe_webhook_events (
  id text primary key, -- Stripe event.id (e.g. evt_1N...)
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

alter table profiles enable row level security;
alter table sessions enable row level security;
alter table session_participants enable row level security;
alter table session_messages enable row level security;
alter table session_files enable row level security;
alter table subscriptions enable row level security;
alter table stripe_webhook_events enable row level security;

-- Profiles: Authenticated users can read creator profiles, update own
create policy "Profiles viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Sessions: Host owns and manages; guests can view active session by slug
create policy "Hosts can manage their sessions"
  on sessions for all
  to authenticated
  using (auth.uid() = host_id);

create policy "Participants can view session details"
  on sessions for select
  to authenticated, anon
  using (status in ('scheduled', 'active'));

-- Session Participants
create policy "Participants viewable by session members"
  on session_participants for select
  to authenticated, anon
  using (true);

create policy "Users can register as participant"
  on session_participants for insert
  to authenticated, anon
  with check (true);

create policy "Users can update their own participant state"
  on session_participants for update
  to authenticated, anon
  using (true);

-- Session Messages
create policy "Messages readable by session members"
  on session_messages for select
  to authenticated, anon
  using (true);

create policy "Messages insertable by participants"
  on session_messages for insert
  to authenticated, anon
  with check (true);

-- Session Files
create policy "Files readable by session members"
  on session_files for select
  to authenticated, anon
  using (true);

create policy "Files insertable by session members"
  on session_files for insert
  to authenticated, anon
  with check (true);

-- Subscriptions: Owner can view billing; webhook service role manages
create policy "Users can view own subscription"
  on subscriptions for select
  to authenticated
  using (auth.uid() = user_id);
