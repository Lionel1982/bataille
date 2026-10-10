// ===== ÉCRAN DE CRÉATION (budget : animal + vêtements + cartes) =====
const $=s=>document.querySelector(s);
const B={pet:'chien',top:'tshirt',bottom:'jean',deck:Object.assign({},DEFAULT_DECK)};
const deckCount=()=>Object.values(B.deck).reduce((a,b)=>a+b,0);
const deckPts=()=>Object.entries(B.deck).reduce((a,[k,v])=>a+v*CARDS[k].pts,0);
const spent=()=>CREATURES[B.pet].pts+TOPS[B.top].pts+BOTTOMS[B.bottom].pts+deckPts();

function renderBuild(){
  const sp=spent(),n=deckCount(),ok=sp<=BUDGET&&n===DECK_SIZE&&B.deck.croq+(B.deck.festin||0)>=6;
  $('#bud').innerHTML=`<div class="${sp>BUDGET?'bad':''}">💰 Budget ${sp}/${BUDGET}<div class="bar"><i style="width:${Math.min(100,sp)}%;background:${sp>BUDGET?'#e53935':'#4caf50'}"></i></div></div>
   <div class="${n!==DECK_SIZE?'bad':''}">🂠 Deck ${n}/${DECK_SIZE}<div class="bar"><i style="width:${n/DECK_SIZE*100}%"></i></div></div>`;
  $('#pets').innerHTML=Object.entries(CREATURES).map(([k,c])=>{const f=FAMILIES[c.f];
    return `<div class="cre ${B.pet===k?'sel':''}" data-pet="${k}"><span class="pt">${c.pts}💰</span><img class="ci" src="${IMG[k]}"><div class="nm">${c.n}</div>
    <span class="fam" style="background:${f.c}">${f.i} ${f.n}</span><div>❤️${c.hp} ⚡${c.spd} 💪${c.pow}</div>
    ${c.t?`<span class="tr">${c.t.map(t=>TRAITS[t].n+' : '+TRAITS[t].d).join(', ')}</span>`:''}</div>`;}).join('');
  const opt=(obj,key)=>Object.entries(obj).map(([k,o])=>`<div class="opt ${B[key]===k?'sel':''}" data-${key}="${k}"><div class="e">${o.i}</div><b>${o.n} · ${o.pts}💰</b>${o.d}</div>`).join('');
  $('#tops').innerHTML=opt(TOPS,'top');
  $('#bottoms').innerHTML=opt(BOTTOMS,'bottom');
  const fam=CREATURES[B.pet].f;$('#deck').innerHTML=Object.entries(CARDS).sort(([,a],[,b])=>((b.fam===fam)-(a.fam===fam))||((a.cost||0)-(b.cost||0))).map(([k,c])=>`<div class="drow${c.fam===fam?' fav':''}${c.big?' bigc':''}"><span class="e">${c.art}</span>
    <div class="tx">${c.fam?FAMILIES[c.fam].i+' ':''}${c.big?'🔥 ':''}${c.n} · ${c.pts}💰${c.cost?' · coût '+c.cost+'🍖':''}<small>${c.txt}</small></div>
    <button data-m="${k}">−</button><span class="ct">${B.deck[k]||0}</span><button data-p="${k}">+</button></div>`).join('');
  const go=$('#goBtn');go.disabled=!ok;
  go.textContent=ok?'⚔️ COMBATTRE !':(n!==DECK_SIZE?`Deck : ${n}/${DECK_SIZE} cartes`:sp>BUDGET?'Budget dépassé !':'Min. 6 Croquettes');
}
$('#build').addEventListener('click',e=>{const t=e.target.closest('[data-pet],[data-top],[data-bottom],[data-m],[data-p]');if(!t)return;const d=t.dataset;
  if(d.pet)B.pet=d.pet;if(d.top)B.top=d.top;if(d.bottom)B.bottom=d.bottom;
  if(d.p&&deckCount()<DECK_SIZE)B.deck[d.p]=(B.deck[d.p]||0)+1;
  if(d.m&&B.deck[d.m]>0)B.deck[d.m]--;
  renderBuild();});
$('#goBtn').onclick=()=>{$('#build').classList.remove('on');$('#fight').classList.add('on');newGame();};
