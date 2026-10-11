-- ============================================================
--  BATAILLE DE PO/ETS — DEBUG (bouton +50 points pour tester la boutique)
--  A coller dans Supabase > SQL Editor > New query > Run
--  ⚠️ A RETIRER avant une vraie mise en production publique.
-- ============================================================
create or replace function debug_add_points(n int)
returns int language plpgsql security definer as $$
declare newtotal int;
begin
  update profiles set shop_points = coalesce(shop_points,0) + n
    where id = auth.uid()
    returning shop_points into newtotal;
  return newtotal;
end; $$;
