// ============================================================
//  MOTEUR DE JEU — pur (sans DOM), testable, deterministe via seed
//  Toute la logique de regles vit ici. React ne fait QUE l'affichage.
// ============================================================
import { CREATURES, TOPS, BOTTOMS, CARDS, FOODS, SODA_MAX, FOOD_CAP, HAND_DRAW, DECK_SIZE } from '../data/cards.js'
const ELOG=(...a)=>console.log('%c[ENGINE]','color:#0288d1',...a)

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
  const hp=cr.hp+(top.hp||0)
  return {
    isMe, key:cfg.pet, avatar:cfg.avatar, name:cfg.name||(isMe?'Toi':'Adversaire'),
    cr, hp, max:hp, deck:buildDeckArray(cfg.cards||cfg.deck||{}, rng),
    hand:[], discard:[], back:[], front:[], backMax:bot.back, frontMax:top.front,
    food:0, foodMax:0, soda:0, foodPlayed:false, extra:false, shield:0,
    fx:{ poison:0, eyes:0, slow:0, blind:0, fear:0, work:0, haste:0, stun:0, aim:0 }
  }
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
export function resolveSpell(attacker, target, card, rng){
  const d=C(card), bonus=famBonus(attacker,d), mul=bonus?1.5:1
  const res={ card:d, bonus, miss:false, dmg:0, texts:[], heal:0 }
  if(d.target==='pet'){
    if(attacker.fx.blind){ attacker.fx.blind=0; if(rng()<0.6){ res.miss='RATE'; } }
    if(!res.miss && rng()<dodgeChance(attacker,target)){ res.miss='ESQUIVE' }
  }
  if(res.miss) return res
  if(d.dmg){
    let dmg=d.dmg*mul
    if(d.phys) dmg*=attacker.cr.pow
    if(hasTrait(attacker,'minuscule')) dmg*=0.75
    if(attacker.fx.fear) dmg/=2
    if(hasTrait(target,'carapace')) dmg*=0.7
    dmg=Math.round(dmg)
    if(target.shield){ const a=Math.min(target.shield,dmg); target.shield-=a; dmg-=a; if(a) res.texts.push('bouclier -'+a) }
    target.hp=Math.max(0,target.hp-dmg); res.dmg=dmg
    res.texts.push(dmg+' degats'+(d.phys&&attacker.cr.pow>=1.4?' (gabarit!)':''))
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
  if(d.hole){
    const all=[...target.back.map(c=>['back',c]),...target.front.map(c=>['front',c])]
    if(all.length){ const [z,c]=all[Math.floor(rng()*all.length)]; target[z].splice(target[z].indexOf(c),1); target.discard.push(c); res.texts.push('perd '+C(c).n+' de sa poche') }
    else res.texts.push('poches vides')
  }
  return res
}

export function startTurnEffects(s){
  const ev=[]
  s.food=s.foodMax; s.foodPlayed=false
  if(s.fx.poison){ s.fx.poison--; const pd=5; s.hp=Math.max(0,s.hp-pd); ev.push({type:'poison',dmg:pd}) }
  if(s.fx.stun){ s.fx.stun=0; ev.push({type:'stun'}) }
  return ev
}
export function endTurnEffects(s){ for(const k of ['eyes','slow','fear','haste']) if(s.fx[k]) s.fx[k]-- }

export const CARD = C
