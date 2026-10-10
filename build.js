// ===== ÉCRAN DE CRÉATION v4 (avatar + animal + fringues + deck vide/sauvegarde) =====
const $=s=>document.querySelector(s);
const SAVE_KEY='bdp_save_v4';
const B={avatar:'h1',pet:'chien',top:'tshirt',bottom:'jean',deck:{}};
// charger une sauvegarde si elle existe
try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&s.pet){Object.assign(B,s);B.deck=s.deck||{};}}catch(e){}

const deckCount=()=>Object.values(B.deck).reduce((a,b)=>a+b,0);
const deckPts=()=>Object.entries(B.deck).reduce((a,[k,v])=>a+v*CARDS[k].pts,0);
const spent=()=>CREATURES[B.pet].pts+TOPS[B.top].pts+BOTTOMS[B.bottom].pts+deckPts();
const foodInDeck=()=>Object.entries(B.deck).filter(([k])=>CARDS[k].type==='food').reduce((a,[k,v])=>a+v*(CARDS[k].gain||1),0);

function saveBuild(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(B));}catch(e){}}

function renderBuild(){
  const sp=spent(),n=deckCount(),food=foodInDeck(),fam=CREATURES[B.pet].f;
  const ok=sp<=BUDGET&&n===DECK_SIZE&&food>=8;
  $('#bud').innerHTML=`<div class="${sp>BUDGET?'bad':''}">💰 ${sp}/${BUDGET}<div class="bar"><i style="width:${Math.min(100,sp/BUDGET*100)}%;background:${sp>BUDGET?'#e53935':'#4caf50'}"></i></div></div>
   <div class="${n!==DECK_SIZE?'bad':''}">🂠 ${n}/${DECK_SIZE}<div class="bar"><i style="width:${n/DECK_SIZE*100}%"></i></div></div>
   <div class="${food<8?'bad':''}">🍖 ${food}<div class="bar"><i style="width:${Math.min(100,food/12*100)}%;background:#ff9800"></i></div></div>`;
  // avatars
  $('#avatars').innerHTML=Object.entries(AVATARS).map(([k,a])=>`<div class="av ${B.avatar===k?'sel':''}" data-avatar="${k}"><img src="${IMG.avatarFull[k]}"><b>${a.n}</b></div>`).join('');
  // animaux
  $('#pets').innerHTML=Object.entries(CREATURES).map(([k,c])=>{const f=FAMILIES[c.f];
    return `<div class="cre ${B.pet===k?'sel':''}" data-pet="${k}"><span class="pt">${c.pts}💰</span><img class="ci" src="${IMG.anim[k]}">
    <div class="nm">${c.n}</div><span class="fam" style="background:${f.c}">${f.i}</span>
    <div class="stt">❤️${c.hp} ⚡${c.spd} 💪${c.pow}</div>
    ${c.t?`<span class="tr">${c.t.map(t=>TRAITS[t].n).join(', ')}</span>`:''}</div>`;}).join('');
  const opt=(obj,key)=>Object.entries(obj).map(([k,o])=>`<div class="opt ${B[key]===k?'sel':''}" data-${key}="${k}"><div class="e">${o.i}</div><b>${o.n}·${o.pts}💰</b>${o.d}</div>`).join('');
  $('#tops').innerHTML=opt(TOPS,'top');$('#bottoms').innerHTML=opt(BOTTOMS,'bottom');
  // cartes triées : famille d'abord, puis coût
  $('#deck').innerHTML=Object.entries(CARDS).sort(([,a],[,b])=>
      ((b.foodType===fam||b.food&&FOODS[b.food].fam===fam)-(a.foodType===fam||a.food&&FOODS[a.food].fam===fam))||((a.cost||0)-(b.cost||0)))
    .map(([k,c])=>{const favFood=c.food&&FOODS[c.food].fam===fam,favSpell=c.foodType===fam;
      return `<div class="drow ${favFood||favSpell?'fav':''} ${c.big?'bigc':''}"><span class="e">${c.art}</span>
      <div class="tx">${c.food?FOODS[c.food].art:''}${c.foodType?FAMILIES[c.foodType].i:''}${c.big?'🔥':''} ${c.n} · ${c.pts}💰${c.cost?' · '+c.cost+'🍖':''}<small>${c.txt}</small></div>
      <button data-m="${k}">−</button><span class="ct">${B.deck[k]||0}</span><button data-p="${k}">+</button></div>`;}).join('');
  const go=$('#goBtn');go.disabled=!ok;
  go.textContent=ok?'⚔️ COMBATTRE !':(n>DECK_SIZE?`Trop de cartes (${n}/${DECK_SIZE})`:n<DECK_SIZE?`Deck : ${n}/${DECK_SIZE}`:food<8?`Pas assez de nourriture (${food}/8)`:'Budget dépassé !');
  saveBuild();
}
$('#build').addEventListener('click',e=>{const t=e.target.closest('[data-avatar],[data-pet],[data-top],[data-bottom],[data-m],[data-p]');if(!t)return;const d=t.dataset;
  if(d.avatar)B.avatar=d.avatar;if(d.pet)B.pet=d.pet;if(d.top)B.top=d.top;if(d.bottom)B.bottom=d.bottom;
  if(d.p&&deckCount()<DECK_SIZE)B.deck[d.p]=(B.deck[d.p]||0)+1;
  if(d.m&&B.deck[d.m]>0){B.deck[d.m]--;if(!B.deck[d.m])delete B.deck[d.m];}
  renderBuild();});
$('#suggestBtn').onclick=()=>{B.deck=suggestedDeck(CREATURES[B.pet].f);renderBuild();};
$('#clearBtn').onclick=()=>{B.deck={};renderBuild();};
$('#goBtn').onclick=()=>{saveBuild();$('#build').classList.remove('on');$('#fight').classList.add('on');newGame();};
