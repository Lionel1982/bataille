-- ============================================================
--  BATAILLE DE PO/ETS — migration ECONOMIE (collection + points)
--  A coller dans Supabase > SQL Editor > New query > Run
--  (complete schema.sql + schema_multi.sql, ne les remplace pas)
-- ============================================================

-- 1) Points d'achat + cartes debloquees, portes par le profil
alter table profiles add column if not exists shop_points int default 0;
alter table profiles add column if not exists collection jsonb default '[]'::jsonb;  -- liste de cles de cartes debloquees

-- 2) Attribution des points en fin de partie classee : +3 victoire, +1 defaite.
--    On expose une fonction RPC securisee (le client ne peut pas se donner des points arbitrairement).
create or replace function award_points(is_win boolean)
returns int language plpgsql security definer as $$
declare pts int; newtotal int;
begin
  pts := case when is_win then 3 else 1 end;
  update profiles set shop_points = coalesce(shop_points,0) + pts
    where id = auth.uid()
    returning shop_points into newtotal;
  return newtotal;
end; $$;

-- 3) Acheter (debloquer) une carte : coute des points, ajoute la cle a la collection.
--    cost_pts = cout en points d'achat de la carte (fourni par le client, borne a >=0).
create or replace function unlock_card(card_key text, cost_pts int)
returns jsonb language plpgsql security definer as $$
declare cur int; col jsonb;
begin
  select coalesce(shop_points,0), coalesce(collection,'[]'::jsonb) into cur, col
    from profiles where id = auth.uid();
  if col ? card_key then return col; end if;              -- deja debloquee
  if cost_pts < 0 then cost_pts := 0; end if;
  if cur < cost_pts then raise exception 'Pas assez de points'; end if;
  update profiles
    set shop_points = cur - cost_pts,
        collection = col || to_jsonb(card_key)
    where id = auth.uid()
    returning collection into col;
  return col;
end; $$;
