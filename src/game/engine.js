// ============================================================
//  MOTEUR DE JEU — pur (sans DOM), testable, deterministe via seed
//  Toute la logique de regles vit ici. React ne fait QUE l'affichage.
// ============================================================
import { CREATURES, TOPS, BOTTOMS, CARDS, FOODS, SODA_MAX, FOOD_CAP, HAND_DRAW, DECK_SIZE } from '../data/cards.js'
const ELOG=(...a)=>console.log('%c[ENGINE]','color:#0288d1',...a)

// ===== NOUVEAU SYSTEME (refonte 11 oct) =====
export const PA_START = 2        // points d'action par tour au depart
export const PA_MAX = 3          // plafond de PA (via rapidite du perso)
export const AGGRO_MAX = 5       // crans d'agressivite
export const AGGRO_DMG = 0.15    // +15% degats par cran
export const PERSO_HP = 40       // PV de base du personnage (avatar)
export const CONF_MAX = 100, CONF_START = 50
export const CONF_LOW = 25       // seuil "confiance basse" -> risque de retournement
export const TURN_RISK = 0.25    // proba de retournement par tour si confiance basse
// paliers de precision (bornes basses -> couleur). Valeur % cachee, couleur = avertissement.
export const ACC_TIERS = [
  { min:0,  col:'#e53935', name:'tres faible' },
  { min:25, col:'#8e24aa', name:'faible' },
  { min:45, col:'#1e88e5', name:'correcte' },
  { min:65, col:'#00bcd4', name:'bonne' },
  { min:85, col:'#fdd835', name:'excellente' }
]
export function accTier(pct){ let t=ACC_TIERS[0]; for(const x of ACC_TIERS) if(pct>=x.min) t=x; return t }

// --- RNG deterministe (mulberry32) : meme seed => meme partie (utile pour le multi) ---
export function makeRng(seed){
  let a = seed >>> 0
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function shuffle(arr, rng){
  const a = arr.slice()
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]] }
  return a
}

const C = c => CARDS[c.key]
export const hasTrait = (s,t) => s.cr.t && s.cr.t.includes(t)
export const spd = s => Math.max(1, s.cr.spd - (s.fx.slow?1:0) + (s.fx.haste?2:0))
export const famBonus = (s,d) => !!(d.foodType && d.foodType === s.cr.f)
export const costOf = (s,c) => { const d=C(c); return Math.max(1,(d.cost||0)+(s.fx.eyes?1:0)-(famBonus(s,d)?1:0)) }

// precision 0..1 : 1 = parfaite, baisse si aveugle/ralenti. Sert a la barre de precision.
export function accuracy(s){
  // Precision de BASE = 0.5 (la barre demarre a la moitie).
  // Les malus la font descendre ; les boosts (fx.aim) la font monter jusqu'a 1.
  let a = 0.5
  if(s.fx.aim)   a += 0.25 * s.fx.aim   // futur boost de precision
  if(s.fx.blind) a -= 0.35
  if(s.fx.slow)  a -= 0.12
  return Math.max(0.05, Math.min(1, a))
}
export function dodgeChance(atk, def){
  if(hasTrait(atk,'enorme')) return 0
  let p = 0.1 + (spd(def)-spd(atk))*0.16
  if(hasTrait(def,'minuscule')) p += 0.12
  return Math.min(0.9, Math.max(0.03, p))
}

let _uid = 0
export function buildDeckArray(cardsMap, rng){
  const deck=[]
  for(const k in cardsMap) for(let i=0;i<cardsMap[k];i++) deck.push({ id:++_uid, key:k })
  ELOG('buildDeckArray :', deck.length, 'cartes depuis', cardsMap)
  return shuffle(deck, rng)
}
export function makeSide(cfg, isMe, rng){
  const cr=CREATURES[cfg.pet], top=TOPS[cfg.top]||TOPS.tshirt, bot=BOTTOMS[cfg.bottom]||BOTTOMS.jean
  const hp=cr.hp+(top.hp||0)            // PV du FAMILIER
  return {
    isMe, key:cfg.pet, avatar:cfg.avatar, name:cfg.name||(isMe?'Toi':'Adversaire'),
    cr, hp, max:hp, deck:buildDeckArray(cfg.cards||cfg.deck||{}, rng),
    hand:[], discard:[], back:[], front:[], backMax:bot.back, frontMax:top.front,
    food:0, foodMax:0, soda:0, foodPlayed:false, extra:false, shield:0,
    // --- NOUVEAU ---
    php: PERSO_HP, phpMax: PERSO_HP,    // PV du PERSONNAGE (avatar)
    pa: PA_START, paMax: PA_START,      // points d'action (recalcule chaque tour)
    conf: CONF_START,                   // confiance du familier (0..100)
    aggro: 0,                           // agressivite (0..AGGRO_MAX)
    turned: 0,                          // >0 : le familier est retourne (nb de tours)
    fx:{ poison:0, eyes:0, slow:0, blind:0, fear:0, work:0, haste:0, stun:0, aim:0, paBonus:0, selfPoison:0 }
  }
}
// Rapidite du perso -> PA du tour (plafonne a PA_MAX). paBonus vient des cartes (rollers...).
export function paForTurn(s){ return Math.min(PA_MAX, PA_START + (s.fx.paBonus||0)) }
// Multiplicateur de degats du familier selon l'agressivite (paliers +15%/cran).
export function aggroMul(s){ return 1 + AGGRO_DMG*(s.aggro||0) }
// Esquive = ecart de rapidite des FAMILIERS, +10%/point, max 80%.
export function dodgeChance2(atk, def){
  if(hasTrait(atk,'enorme') && !(def.fx&&def.fx.dodgeBoost)) return 0
  let p = (spd(def)-spd(atk))*0.10
  if(hasTrait(def,'minuscule')) p += 0.10
  if(def.fx && def.fx.dodgeBoost) p = Math.max(p*2, 0.5)   // Caprice : esquive doublee (min 50%)
  return Math.min(0.90, Math.max(0, p))
}
// Confiance -> variation. type 'calin' (+conf) ou 'brime' (+conf +aggro).
export function addConfidence(s, amount, alsoAggro){
  s.conf = Math.max(0, Math.min(CONF_MAX, s.conf + amount))
  if(alsoAggro) s.aggro = Math.min(AGGRO_MAX, s.aggro + 1)
}
// Risque de retournement : si confiance basse, proba TURN_RISK chaque debut de tour.
export function checkTurn(s, rng){
  if(s.turned>0) return false
  if(s.conf <= CONF_LOW && rng() < TURN_RISK){ s.turned = 1; return true }
  return false
}
export function drawCards(s, n){
  for(let i=0;i<n;i++){
    if(!s.deck.length){
      if(!s.discard.length){ ELOG('drawCards : plus de cartes (deck+discard vides) pour', s.name); break }
      ELOG('drawCards : recyclage defausse ('+s.discard.length+') dans le deck')
      s.deck = shuffle(s.discard, makeRng((Date.now()^(i*2654435761))>>>0)); s.discard=[]
    }
    s.hand.push(s.deck.pop())
  }
  ELOG('drawCards :', s.name, 'main='+s.hand.length, 'deck restant='+s.deck.length)
  return []
}
export const canPlayFood = s => !s.foodPlayed && s.foodMax < FOOD_CAP
export function whyNot(s,c){
  const d=C(c)
  if(d.type==='food') return s.foodPlayed ? 'Deja 1 nourriture ce tour' : (s.foodMax>=FOOD_CAP?'Reserve pleine':'')
  if(d.type==='soda') return ''
  const k=costOf(s,c); return k>s.food ? ('Il manque '+(k-s.food)+' nourriture') : ''
}

// Applique l'effet d'un sort. Retourne un descriptif { dmg, miss, texts[] } pour l'animation cote React.
export function resolveSpell(attacker, target, card, rng, overrideTarget){
  const d0=C(card); const d = overrideTarget ? {...d0, target:overrideTarget} : d0
  const bonus=famBonus(attacker,d), mul=bonus?1.5:1
  const res={ card:d, bonus, miss:false, dmg:0, texts:[], heal:0, hitPerso:false }
  // cible : 'pet' = familier adverse (esquivable), 'perso' = l'avatar adverse (non esquivable), 'pote' alias de 'perso'
  const aimPerso = (d.target==='perso' || d.target==='pote')
  if(d.target==='pet'){
    if(attacker.fx.blind){ attacker.fx.blind=0; if(rng()<0.6){ res.miss='RATE'; } }
    if(!res.miss && rng()<dodgeChance2(attacker,target)){ res.miss='ESQUIVE' }
  }
  if(res.miss) return res
  if(d.dmg){
    let dmg=d.dmg*mul
    if(d.phys) dmg*=attacker.cr.pow
    dmg*=aggroMul(attacker)                       // agressivite : +15%/cran
    if(hasTrait(attacker,'minuscule')) dmg*=0.75
    if(attacker.fx.fear) dmg/=2
    if(hasTrait(target,'carapace') && !aimPerso) dmg*=0.7
    dmg=Math.round(dmg)
    if(aimPerso){
      target.php=Math.max(0,(target.php||0)-dmg); res.hitPerso=true
      res.texts.push(dmg+' degats au perso')
    } else {
      if(target.shield){ const a=Math.min(target.shield,dmg); target.shield-=a; dmg-=a; if(a) res.texts.push('bouclier -'+a) }
      target.hp=Math.max(0,target.hp-dmg)
      res.texts.push(dmg+' degats'+(attacker.aggro>=3?' (familier enrage!)':''))
    }
    res.dmg=dmg
  }
  if(d.poison){ target.fx.poison=Math.round(d.poison*(mul>1?1.3:1)); res.texts.push('poison '+target.fx.poison+' tours') }
  if(d.eyes){ target.fx.eyes=d.eyes; res.texts.push('sorts +1 cout') }
  if(d.slow){ target.fx.slow=d.slow; res.texts.push('ralenti') }
  if(d.blind){ target.fx.blind=1; res.texts.push('aveugle') }
  if(d.fear){ target.fx.fear=d.fear; res.texts.push('degats /2') }
  if(d.work){ target.fx.work=1; res.texts.push('pioche -2') }
  if(d.stun){ target.fx.stun=1; res.texts.push('saute son tour') }
  if(d.heal){ const h=Math.round(d.heal*mul); attacker.hp=Math.min(attacker.max,attacker.hp+h); res.heal=h; res.texts.push('+'+h+' PV') }
  if(d.cleanse){ for(const k of ['poison','eyes','slow','blind','fear']) attacker.fx[k]=0; res.texts.push('malus retires') }
  if(d.shield){ attacker.shield+=Math.round(d.shield*mul); res.texts.push('bouclier '+attacker.shield) }
  if(d.haste){ attacker.fx.haste=d.haste; res.texts.push('+2 vitesse') }
  if(d.draw){ drawCards(attacker,d.draw); res.texts.push('pioche '+d.draw) }
  // --- NOUVEAU : confiance / agressivite / PA ---
  // Reconfort : +confiance, -agressivite (le familier se calme)
  if(d.calin){ attacker.conf=Math.max(0,Math.min(CONF_MAX,attacker.conf+d.calin)); attacker.aggro=Math.max(0,attacker.aggro-(d.calmAggro||0)); res.texts.push('+'+d.calin+' confiance'+(d.calmAggro?', -'+d.calmAggro+' agressivite':'')) }
  // Brimade : +agressivite, -confiance (le familier devient hargneux mais te fait moins confiance)
  if(d.brime){ attacker.aggro=Math.min(AGGRO_MAX,attacker.aggro+(d.brimeAggro||1)); attacker.conf=Math.max(0,attacker.conf-d.brime); res.texts.push('+'+(d.brimeAggro||1)+' agressivite, -'+d.brime+' confiance') }
  if(d.aggro){ attacker.aggro=Math.min(AGGRO_MAX, attacker.aggro+d.aggro); res.texts.push('+'+d.aggro+' agressivite') }
  if(d.pa){ attacker.pa += d.pa; res.texts.push('+'+d.pa+' PA') }
  if(d.selfhurt){ attacker.php=Math.max(0, attacker.php-d.selfhurt); res.texts.push('-'+d.selfhurt+' PV perso') }
  if(d.aim){ attacker.fx.aim=(attacker.fx.aim||0)+d.aim; res.texts.push('+precision') }
  if(d.hole){
    const all=[...target.back.map(c=>['back',c]),...target.front.map(c=>['front',c])]
    if(all.length){ const [z,c]=all[Math.floor(rng()*all.length)]; target[z].splice(target[z].indexOf(c),1); target.discard.push(c); res.texts.push('perd '+C(c).n+' de sa poche') }
    else res.texts.push('poches vides')
  }
  return res
}

export function applyPetSpell(caster, foe, sp, rng){
  // Verifie et CONSOMME la ressource, puis applique l'effet. Retourne {ok, texts:[]}.
  const res={ ok:false, texts:[], fx:sp.name }
  // --- cout / seuil ---
  if(sp.res==='conf'){ if((caster.conf||0)<sp.need) return res; caster.conf=Math.max(0,caster.conf-sp.cost) }
  else if(sp.res==='aggro'){ if((caster.aggro||0)<sp.need) return res; caster.aggro=Math.max(0,caster.aggro-sp.cost) }
  else if(sp.res==='hp'){ if((caster.hp||0)<=sp.cost) return res; caster.hp=Math.max(1,caster.hp-sp.cost); res.texts.push('sacrifie '+sp.cost+' PV') }
  else if(sp.res==='mix'){ if((caster.conf||0)<30||(caster.aggro||0)<2) return res; caster.conf=Math.max(0,caster.conf-30); caster.aggro=Math.max(0,caster.aggro-2) }
  else return res
  res.ok=true
  // --- effets ---
  if(sp.heal){ const before=caster.hp; caster.hp=Math.min(caster.max, caster.hp+sp.heal); const g=caster.hp-before; if(g>0) res.texts.push('+'+g+' PV familier') }
  if(sp.healPhp){ const b=caster.php; caster.php=Math.min(caster.phpMax, caster.php+sp.healPhp); const g=caster.php-b; if(g>0) res.texts.push('+'+g+' PV perso') }
  if(sp.dmg){
    // degats au familier adverse : esquive possible, bonus d'agressivite applique
    if(rng()<dodgeChance2(caster, foe)){ res.texts.push('ESQUIVE') }
    else {
      let dmg=Math.round(sp.dmg*aggroMul(caster))
      if(foe.shield){ const a=Math.min(foe.shield,dmg); foe.shield-=a; dmg-=a; if(a) res.texts.push('bouclier -'+a) }
      foe.hp=Math.max(0, foe.hp-dmg); res.texts.push(dmg+' degats')
    }
  }
  if(sp.dodgeBoost){ caster.fx=caster.fx||{}; caster.fx.dodgeBoost=1; res.texts.push('esquive doublee ce tour') }
  return res
}

export function startTurnEffects(s, rng){
  const ev=[]
  s.food=s.foodMax; s.foodPlayed=false
  // PA du tour (rapidite perso), paBonus retombe apres usage
  s.paMax = paForTurn(s); s.pa = s.paMax
  // poison sur le familier
  if(s.fx.poison){ s.fx.poison--; const pd=5; s.hp=Math.max(0,s.hp-pd); ev.push({type:'poison',dmg:pd}) }
  // auto-poison (accelerateur) : blesse le perso chaque tour
  if(s.fx.selfPoison){ s.fx.selfPoison--; s.php=Math.max(0,s.php-3); ev.push({type:'selfpoison',dmg:3}) }
  // le familier retourne : il a attaque son maitre, l'etat retombe
  if(s.turned>0){ s.turned--; if(s.turned===0) ev.push({type:'calmed'}) }
  // sinon, risque de retournement si confiance basse
  else if(rng && checkTurn(s, rng)){ ev.push({type:'turn'}) }
  if(s.fx.stun){ s.fx.stun=0; ev.push({type:'stun'}) }
  return ev
}
export function endTurnEffects(s){ for(const k of ['eyes','slow','fear','haste']) if(s.fx[k]) s.fx[k]--; s.fx.paBonus=0; s.fx.dodgeBoost=0 }

// Une carte consomme un POINT D'ACTION si elle implique le LANCEUR (perso) :
// nourriture, soda, et sorts qui ne ciblent PAS uniquement le familier (self/pote/perso/choose).
// Les attaques du familier seul (target 'pet') ne coutent QUE de la nourriture.
// Cout en points d'action d'une carte (0 si elle n'utilise pas de PA, sinon paCost ou 1 par defaut).
// Categorie d'une carte pour les filtres de l'ecran deck.
// 'nourriture' | 'joueur' (consomme PA) | 'familier' (attaque du familier)
export function cardCategory(card){
  const d = card.key ? C(card) : card
  if(d.type==='food' || d.type==='soda') return 'nourriture'
  if(d.type==='spell') return d.target==='pet' ? 'familier' : 'joueur'
  return 'joueur'
}
export function paCostOf(card){
  const d = card.key ? C(card) : card
  if(!usesPA(d)) return 0
  return d.paCost || 1
}
export function usesPA(card){
  const d = card.key ? C(card) : card
  if(d.type==='food' || d.type==='soda') return true
  if(d.type==='spell') return d.target!=='pet'
  return true
}
export const CARD = C
