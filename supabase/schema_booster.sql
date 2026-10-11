-- ============================================================
--  BATAILLE DE PO/ETS — migration BOOSTER (10 pts -> 3 cartes)
--  A coller dans Supabase > SQL Editor > New query > Run
--  (complete schema_economy.sql ; a lancer APRES lui)
-- ============================================================

-- Ouvre un booster : coute 10 points, tire 3 cartes.
--  - p_pool        : toutes les cles de cartes achetables (hors deck de base), fourni par le client
--  - p_finishers   : sous-ensemble "finisher" (rares)
--  - p_refund_each : remboursement par doublon (points)
-- Le tirage se fait cote SERVEUR (securise). On evite les doublons tant qu'il reste
-- des cartes non possedees ; sinon on rembourse p_refund_each par doublon.
create or replace function open_booster(p_pool text[], p_finishers text[], p_refund_each int)
returns jsonb language plpgsql security definer as $$
declare
  cur int; col jsonb; owned text[]; avail text[]; finAvail text[];
  pick text; got text[] := '{}'; refunded int := 0; i int; r double precision;
begin
  select coalesce(shop_points,0), coalesce(collection,'[]'::jsonb) into cur, col
    from profiles where id = auth.uid();
  if cur < 10 then raise exception 'Pas assez de points (10 requis)'; end if;

  -- liste des cartes deja possedees (collection)
  select array(select jsonb_array_elements_text(col)) into owned;

  cur := cur - 10;   -- on paie le booster

  for i in 1..3 loop
    -- cartes encore disponibles (pool - possedees - deja tirees ce booster)
    select array(select unnest(p_pool) except select unnest(owned) except select unnest(got)) into avail;
    if array_length(avail,1) is null then
      -- plus rien a debloquer : remboursement
      cur := cur + p_refund_each; refunded := refunded + p_refund_each; continue;
    end if;
    -- rarete : 15% de viser un finisher si dispo, sinon tirage uniforme
    r := random();
    select array(select unnest(avail) intersect select unnest(p_finishers)) into finAvail;
    if r < 0.15 and array_length(finAvail,1) is not null then
      pick := finAvail[1 + floor(random()*array_length(finAvail,1))];
    else
      pick := avail[1 + floor(random()*array_length(avail,1))];
    end if;
    got := got || pick;
  end loop;

  -- appliquer : ajouter les cartes tirees a la collection, maj points
  if array_length(got,1) is not null then
    col := col || to_jsonb(got);
  end if;
  update profiles set shop_points = cur, collection = col where id = auth.uid();

  return jsonb_build_object('got', to_jsonb(got), 'refunded', refunded, 'points', cur, 'collection', col);
end; $$;
