-- ============================================================
--  BATAILLE DE PO/ETS — schema Supabase
--  A coller dans Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1) PROFILS (1 par utilisateur Auth)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text unique not null,
  avatar text default 'h1',
  created_at timestamptz default now(),
  wins int default 0,
  losses int default 0,
  elo int default 1000
);
alter table profiles enable row level security;
create policy "profils lisibles par tous" on profiles for select using (true);
create policy "je modifie mon profil" on profiles for update using (auth.uid() = id);
create policy "je cree mon profil" on profiles for insert with check (auth.uid() = id);

-- 2) DECKS sauvegardes (plusieurs par joueur)
create table if not exists decks (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users(id) on delete cascade,
  name text not null default 'Mon deck',
  pet text not null,
  top text not null default 'tshirt',
  bottom text not null default 'jean',
  cards jsonb not null default '{}',
  updated_at timestamptz default now()
);
alter table decks enable row level security;
create policy "je vois mes decks" on decks for select using (auth.uid() = owner);
create policy "je gere mes decks" on decks for all using (auth.uid() = owner) with check (auth.uid() = owner);

-- 3) CLASSEMENT (vue lecture seule, triee par ELO)
create or replace view leaderboard as
  select pseudo, avatar, wins, losses, elo
  from profiles order by elo desc, wins desc limit 100;

-- 4) PARTIES EN TEMPS REEL (matchmaking + etat partage)
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'waiting',   -- waiting | playing | finished
  host uuid references auth.users(id) on delete cascade,
  guest uuid references auth.users(id) on delete set null,
  host_deck jsonb,
  guest_deck jsonb,
  state jsonb,              -- etat de jeu partage (tour courant, pv, etc.)
  turn uuid,                -- a qui de jouer
  winner uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table matches enable row level security;
-- un match est visible/modifiable par ses deux joueurs ; les 'waiting' sont visibles pour le matchmaking
create policy "matchs en attente visibles" on matches for select using (status = 'waiting' or auth.uid() = host or auth.uid() = guest);
create policy "je cree un match" on matches for insert with check (auth.uid() = host);
create policy "les joueurs modifient le match" on matches for update using (auth.uid() = host or auth.uid() = guest);

-- Realtime : diffuser les changements de 'matches'
alter publication supabase_realtime add table matches;

-- 5) Creation auto du profil a l'inscription
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, coalesce(new.raw_user_meta_data->>'pseudo', 'Joueur_'||substr(new.id::text,1,6)));
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
