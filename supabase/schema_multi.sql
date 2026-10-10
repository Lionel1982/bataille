-- ============================================================
--  BATAILLE DE PO/ETS — migration MULTIJOUEUR "partie par code"
--  A coller dans Supabase > SQL Editor > New query > Run
--  (complete le schema.sql existant, ne le remplace pas)
-- ============================================================

-- 1) Code de partie (4-6 caracteres) sur la table matches
alter table matches add column if not exists code text;
create unique index if not exists matches_code_active
  on matches(code) where status in ('waiting','playing');

-- 2) Pouvoir trouver une partie par son code (lecture) meme si on n'est pas encore dedans
drop policy if exists "matchs en attente visibles" on matches;
create policy "matchs visibles (code ou joueur)" on matches for select
  using (status in ('waiting','playing') or auth.uid() = host or auth.uid() = guest);

-- 3) Pouvoir REJOINDRE : un invite met son id dans guest quand la partie attend
drop policy if exists "les joueurs modifient le match" on matches;
create policy "modif match (joueurs ou rejoindre)" on matches for update
  using (
    auth.uid() = host
    or auth.uid() = guest
    or (status = 'waiting' and guest is null)   -- rejoindre une partie en attente
  )
  with check (
    auth.uid() = host or auth.uid() = guest
  );

-- 4) S'assurer que Realtime diffuse bien matches (idempotent)
do $$
begin
  begin
    alter publication supabase_realtime add table matches;
  exception when duplicate_object then null;
  end;
end $$;
