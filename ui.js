// ===== AFFICHAGE COMBAT + INTERACTIONS v4 =====
const say=t=>$('#msg').textContent=t;
const costLbl=(s,c)=>{const d=C(c);if(d.type==='food')return '+'+(d.gain||1)+'🍖';if(d.type==='soda')return '+1⚡';return costOf(s,c)+'🍖';};
function cardArt(d){ // gros dessin : image si dispo (animal/famille), sinon gros emoji
  return `<div class="art">${d.art}</div>`;}
function cardHTML(c,s,extra){const d=C(c),bonus=s&&famBonus(s,d);
  return `<div class="card t-${d.type} ${d.target==='pote'?'pote':''} ${d.big?'bigc':''} ${bonus?'fav':''} ${extra||''}" data-id="${c.id}">
    <span class="cost">${costLbl(s,c)}</span>${d.foodType?`<span class="famb" style="background:${FAMILIES[d.foodType].c}">${FAMILIES[d.foodType].i}</span>`:d.food?`<span class="famb" style="background:${FAMILIES[FOODS[d.food].fam].c}">${FOODS[d.food].art}</span>`:''}
    ${cardArt(d)}<div class="name">${d.n}</div><div class="txt">${d.txt}</div></div>`;}
async function reveal(c){const w=document.createElement('div');w.className='reveal';w.innerHTML=cardHTML(c,opp);scene().appendChild(w);await sleep(G.pause?1100:720);w.remove();}
function status(s){const f=s.fx,o=[];if(f.poison)o.push('☠️'+f.poison);if(f.eyes)o.push('😵'+f.eyes);if(f.slow)o.push('🐌'+f.slow);if(f.blind)o.push('🏖️');if(f.fear)o.push('😱'+f.fear);if(f.work)o.push('💼');if(f.haste)o.push('🪶'+f.haste);if(f.stun)o.push('💫');if(s.shield)o.push('🫧'+s.shield);return o.join(' ');}
function selCard(){if(!G.sel)return null;const l=G.sel.from==='hand'?me.hand:me[G.sel.from];return l.find(x=>x.id===G.sel.id)||null;}

function render(){
  if(!G)return;
  $('#foodTxt').innerHTML=`${me.food}<small>/${me.foodMax}</small>`;
  $('#sodaPips').innerHTML=Array.from({length:SODA_MAX},(_,i)=>`<i class="${i<me.soda?'on':''}"></i>`).join('');
  for(const [s,k] of [[me,'my'],[opp,'opp']]){const p=s.hp/s.max;const f=$('#'+k+'Hp');f.style.width=p*100+'%';f.style.background=p>.5?'#4caf50':p>.25?'#ff9800':'#f44336';
    $('#'+k+'Name').textContent=(s.isMe?'TOI & ':'ALEX & ')+s.cr.n.toUpperCase()+' '+FAMILIES[s.cr.f].i;
    $('#'+k+'HpTxt').textContent=s.hp+'/'+s.max;
    $('#'+k+'St').textContent=`⚡${spd(s)} `+(s.isMe?'':`🍖${s.food}/${s.foodMax} 👖${s.back.length} `)+status(s);}
  const of=$('#oppFront');if(of)of.innerHTML=opp.front.length?C(opp.front[0]).art:'';
  $('#turnTag').textContent='TOUR '+G.turn+(G.active===me?' · TOI':' · ALEX');
  $('#deckN').textContent=me.deck.length;$('#discN').textContent=me.discard.length;
  $('#endBtn').disabled=G.busy||G.active!==me||G.over;
  const slot=(z,i)=>{const c=me[z][i];if(!c)return `<div class="slot empty ${z}">vide</div>`;
    return `<div class="slot t-${C(c).type} ${z} ${G.sel&&G.sel.id===c.id?'sel':''}" data-id="${c.id}" data-z="${z}">${C(c).art}</div>`;};
  $('#pocketSlots').innerHTML=[...Array(me.backMax).keys()].map(i=>slot('back',i)).join('')+[...Array(me.frontMax).keys()].map(i=>slot('front',i)).join('');
  const mine=G.active===me&&!G.over,n=me.hand.length;
  $('#hand').innerHTML=n?me.hand.map((c,i)=>{const off=i-(n-1)/2,sel=G.sel&&G.sel.id===c.id;
    const tr=sel?`translate(${off*66}px,-54px) scale(1.12)`:`translate(${off*66}px,${off*off*5}px) rotate(${off*6}deg)`;
    return cardHTML(c,me,(mine&&whyNot(me,c)?'disabled':'')+(sel?' sel':'')).replace('class="card','style="transform:'+tr+'" class="card');}).join('')
    :`<div class="handmsg">${G.active===me?'Main vide → FIN DU TOUR':'Alex réfléchit… 🤔'}</div>`;
  const bar=$('#actbar'),c=selCard();
  if(!c||G.busy||!mine){bar.classList.remove('on');return;}
  const why=whyNot(me,c),room=me.back.length<me.backMax||me.front.length<me.frontMax;
  bar.innerHTML=`<div class="lbl">${C(c).n} · ${costLbl(me,c)}${why?'<em>'+why+'</em>':''}</div>
    <button data-a="play" ${why?'disabled':''}>JOUER</button>
    ${G.sel.from==='hand'?`<button class="alt" data-a="pocket" ${room?'':'disabled'}>👖</button>`:''}
    <button class="x" data-a="x">✕</button>`;
  bar.classList.add('on');
}
$('#hand').addEventListener('click',e=>{const el=e.target.closest('.card');if(!el||G.busy||G.active!==me||G.over)return;const id=+el.dataset.id;G.sel=G.sel&&G.sel.id===id?null:{id,from:'hand'};render();});
$('#pocketSlots').addEventListener('click',e=>{const el=e.target.closest('[data-id]');if(!el||G.busy||G.active!==me||G.over)return;const id=+el.dataset.id;G.sel=G.sel&&G.sel.id===id?null:{id,from:el.dataset.z};render();});
$('#actbar').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const c=selCard();if(!c)return;
  if(b.dataset.a==='play')playCard(me,c,G.sel.from);else if(b.dataset.a==='pocket')pocketCard(c);else{G.sel=null;render();}});
$('#endBtn').onclick=()=>{if(!G.busy&&G.active===me)endTurn();};
$('#soundBtn').onclick=()=>{$('#soundBtn').textContent=SFX.toggle()?'🔊 SON : ON':'🔇 SON : OFF';};
$('#fastBtn').onclick=()=>{G=G||{};G.fast=!G.fast;$('#fastBtn').textContent=G.fast?'⏩ RAPIDE : ON':'▶ RAPIDE : OFF';};
$('#pauseBtn').onclick=()=>{G=G||{};G.pause=!G.pause;$('#pauseBtn').textContent=G.pause?'⏸ PAUSE : ON':'▶ PAUSE : OFF';};
renderBuild();
