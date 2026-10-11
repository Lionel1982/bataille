// ============================================================
//  MULTIJOUEUR "partie par code" — couche Supabase
//  Toute la logique reseau vit ici. L'ecran Online appelle ces fonctions.
// ============================================================
import { supabase, online } from './supabase.js'

const LOG=(...a)=>console.log('%c[NET]','color:#00897b;font-weight:bold',...a)

// Code lisible a 4 lettres (sans voyelles ambigües) — ex: "BQ7K"
function makeCode(){
  const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c=''; for(let i=0;i<4;i++) c+=A[Math.floor(Math.random()*A.length)]
  return c
}

// Cree une partie : je deviens l'hote, j'obtiens un code a partager.
export async function createMatch(myDeck){
  if(!online) throw new Error('offline')
  const { data:{ user } } = await supabase.auth.getUser()
  if(!user) throw new Error('non connecte')
  // reessaie si collision de code (index unique sur les parties actives)
  for(let tries=0; tries<6; tries++){
    const code=makeCode()
    const { data, error } = await supabase.from('matches').insert({
      status:'waiting', host:user.id, host_deck:myDeck, code
    }).select().single()
    if(!error){ LOG('createMatch OK code=',code,'id=',data.id); return data }
    if(error && !/duplicate|unique/i.test(error.message)){ LOG('createMatch err',error); throw error }
  }
  throw new Error('impossible de generer un code libre')
}

// Rejoindre une partie par code : je deviens guest.
export async function joinMatch(code, myDeck){
  if(!online) throw new Error('offline')
  const { data:{ user } } = await supabase.auth.getUser()
  if(!user) throw new Error('non connecte')
  code=(code||'').toUpperCase().trim()
  const { data:found, error:e1 } = await supabase.from('matches')
    .select('*').eq('code',code).eq('status','waiting').is('guest',null).maybeSingle()
  if(e1) throw e1
  if(!found) throw new Error('Aucune partie en attente avec ce code')
  const { data, error } = await supabase.from('matches')
    .update({ guest:user.id, guest_deck:myDeck, status:'playing' })
    .eq('id',found.id).eq('status','waiting').select().single()
  if(error) throw error
  LOG('joinMatch OK id=',data.id); return data
}

// Ecoute en temps reel les changements d'une partie (statut, state, tour...).
export function subscribeMatch(matchId, onChange){
  if(!online) return ()=>{}
  const ch = supabase.channel('match:'+matchId)
    .on('postgres_changes',
      { event:'UPDATE', schema:'public', table:'matches', filter:'id=eq.'+matchId },
      payload=>{ LOG('realtime update', payload.new?.status); onChange(payload.new) })
    .subscribe(s=>LOG('subscribe', s))
  return ()=>{ supabase.removeChannel(ch) }
}

// Pousser le nouvel etat de jeu (apres une action), avec a qui de jouer.
export async function pushState(matchId, state, turnUserId, winnerUserId){
  if(!online) return
  const patch={ state, turn:turnUserId, updated_at:new Date().toISOString() }
  if(winnerUserId!==undefined){ patch.winner=winnerUserId; patch.status='finished' }
  const { error } = await supabase.from('matches').update(patch).eq('id',matchId)
  if(error) LOG('pushState err',error)
}

// Abandonner / quitter : marque la partie finie.
export async function leaveMatch(matchId, winnerUserId){
  if(!online) return
  await supabase.from('matches').update({ status:'finished', winner:winnerUserId||null }).eq('id',matchId)
}

// Recharger l'etat courant d'une partie (au cas ou on rate un event).
export async function fetchMatch(matchId){
  if(!online) return null
  const { data } = await supabase.from('matches').select('*').eq('id',matchId).single()
  return data
}


// ===== SYNCHRO ACTION-PAR-ACTION (broadcast temps reel) =====
// On utilise le "broadcast" du canal Realtime : pas besoin de table dediee.
// Chaque joueur envoie ses actions ; l'autre les rejoue sur SON adversaire (opp).

let _chan = null
export function openMatchChannel(matchId, { onAction, onPresence, onJoinReady } = {}){
  if(!online) return ()=>{}
  const ch = supabase.channel('live:'+matchId, { config:{ broadcast:{ self:false }, presence:{ key: Math.random().toString(36).slice(2) } } })
  ch.on('broadcast', { event:'action' }, ({payload})=>{ LOG('recv action', payload?.kind); onAction && onAction(payload) })
  ch.on('presence', { event:'sync' }, ()=>{ const st=ch.presenceState(); const n=Object.keys(st).length; LOG('presence', n); onPresence && onPresence(n) })
  ch.subscribe(async (status)=>{ LOG('live channel', status); if(status==='SUBSCRIBED'){ await ch.track({ at: Date.now() }); onJoinReady && onJoinReady() } })
  _chan = ch
  return ()=>{ try{ supabase.removeChannel(ch) }catch(e){}; if(_chan===ch) _chan=null }
}
export function sendAction(payload){
  if(!_chan) { LOG('sendAction sans canal'); return }
  _chan.send({ type:'broadcast', event:'action', payload })
}
// Tirage au sort du premier joueur, deterministe a partir de l'id de match (meme resultat des 2 cotes).
export function firstPlayerIsHost(matchId){
  let h=0; for(const c of String(matchId)) h=(h*31 + c.charCodeAt(0))>>>0
  return (h % 2)===0
}
