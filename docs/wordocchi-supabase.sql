begin;

create extension if not exists pgcrypto;

alter table public.games
add column if not exists current_player_id uuid
references public.players(id)
on delete set null;

alter table public.games
add column if not exists round_number integer not null default 0;

alter table public.games
add column if not exists first_word_candidates jsonb;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  word text not null,
  round_number integer not null,
  selected boolean not null default false,
  created_at timestamptz not null default now(),
  unique (game_id, player_id, round_number)
);

create index if not exists submissions_game_id_idx
  on public.submissions (game_id);

create index if not exists submissions_player_id_idx
  on public.submissions (player_id);

create index if not exists submissions_game_player_round_idx
  on public.submissions (game_id, player_id, round_number);

alter table public.submissions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'submissions'
      and policyname = 'submissions_select_anon'
  ) then
    create policy submissions_select_anon
      on public.submissions
      for select
      to anon
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'submissions'
      and policyname = 'submissions_insert_anon'
  ) then
    create policy submissions_insert_anon
      on public.submissions
      for insert
      to anon
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'submissions'
      and policyname = 'submissions_update_anon'
  ) then
    create policy submissions_update_anon
      on public.submissions
      for update
      to anon
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'submissions'
      and policyname = 'submissions_delete_anon'
  ) then
    create policy submissions_delete_anon
      on public.submissions
      for delete
      to anon
      using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'games'
  ) then
    alter publication supabase_realtime add table public.games;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'players'
  ) then
    alter publication supabase_realtime add table public.players;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'submissions'
  ) then
    alter publication supabase_realtime add table public.submissions;
  end if;
end
$$;

commit;
