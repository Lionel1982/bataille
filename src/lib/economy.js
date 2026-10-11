// ============================================================
//  ECONOMIE : points de boutique + collection debloquee (Supabase)
// ============================================================
import { supabase, online } from './supabase.js'
const LOG=(...a)=>console.log('%c[SHOP]','color:#6a1b9a;font-weight:bold',...a)

// Lire points + collection du joueur connecte. Repli hors-ligne : null.
export async function loadWallet(){
  if(!online) return null
  const { data:{ user } } = await supabase.auth.getUser()
  if(!user) return null
  const { data, error } = await supabase.from('profiles').select('shop_points, collection').eq('id',user.id).single()
  if(error){ LOG('loadWallet err', error.message); return null }
  return { points: data.shop_points||0, collection: data.collection||[] }
}

// Debloquer une carte (RPC securisee cote serveur).
export async function unlockCard(key, costPts){
  if(!online) throw new Error('offline')
  const { data, error } = await supabase.rpc('unlock_card', { card_key:key, cost_pts:costPts })
  if(error) throw error
  LOG('unlockCard', key, '-> collection', data)
  return data   // nouvelle collection
}

// Attribuer les points en fin de partie classee (RPC : +3 victoire / +1 defaite).
export async function awardPoints(isWin){
  if(!online) return null
  const { data, error } = await supabase.rpc('award_points', { is_win:!!isWin })
  if(error){ LOG('awardPoints err', error.message); return null }
  LOG('awardPoints', isWin?'win':'loss', '-> total', data)
  return data   // nouveau total de points
}


// Ouvrir un booster (10 pts -> 3 cartes). Tirage securise cote serveur.
export async function openBooster(pool, finishers, refundEach){
  if(!online) throw new Error('offline')
  const { data, error } = await supabase.rpc('open_booster', { p_pool:pool, p_finishers:finishers, p_refund_each:refundEach })
  if(error) throw error
  LOG('openBooster ->', data)
  return data   // { got:[...], refunded, points, collection }
}

// DEBUG : s'ajouter des points pour tester la boutique (a retirer en prod).
export async function debugAddPoints(n){
  if(!online) throw new Error('offline')
  const { data, error } = await supabase.rpc('debug_add_points', { n })
  if(error) throw error
  return data
}
