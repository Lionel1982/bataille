// ===== MOTEUR v4 (nourriture par famille souple, meilleur équilibrage) =====
let G=null,me,opp,uid=0;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const C=c=>CARDS[c.key];
const other=s=>s===me?opp:me;
const hasT=(s,t)=>s.cr.t&&s.cr.t.includes(t);

function makeSide(cfg,isMe){
  const cr=CREATURES[cfg.pet],top=TOPS[cfg.top],bot=BOTTOMS[cfg.bottom],deck=[];
  for(const k in cfg.deck)for(let i=0;i<cfg.deck[k];i++)deck.push({id:++uid,key:k});
  const hp=cr.hp+top.hp;
  return {isMe,key:cfg.pet,avatar:cfg.avatar,cr,hp,max:hp,deck:shuffle(deck),hand:[],discard:[],back:[],front:[],backMax:bot.back,frontMax:top.front,
    food:0,foodMax:0,soda:0,foodPlayed:false,extra:false,shield:0,
    fx:{poison:0,eyes:0,slow:0,blind:0,fear:0,work:0,haste:0,stun:0},
    petEl:$(isMe?'#myPet':'#oppPet'),poteEl:$(isMe?'#myPote':'#oppPote'),name:isMe?'Toi':'Alex'};
}
const spd=s=>Math.max(1,s.cr.spd-(s.fx.slow?1:0)+(s.fx.haste?2:0));
// Nourriture SOUPLE : la bonne famille donne -1 coût (et +50% d'effet via mul). N'importe quelle nourriture paie sinon.
const famBonus=(s,d)=>{const f=d.foodType;return f&&f===s.cr.f;};
const costOf=(s,c)=>{const d=C(c);return Math.max(1,(d.cost||0)+(s.fx.eyes?1:0)-(famBonus(s,d)?1:0));};
function dodgeChance(atk,def){if(hasT(atk,'enorme'))return 0;let p=.1+(spd(def)-spd(atk))*.16;if(hasT(def,'minuscule'))p+=.12;return Math.min(.9,Math.max(.03,p));}
function whyNot(s,c){const d=C(c);
  if(d.type==='food')return s.foodPlayed?'Déjà 1 nourriture ce tour':s.foodMax>=FOOD_CAP?'Réserve pleine (max 10)':'';
  if(d.type==='soda')return '';
  const k=costOf(s,c);return k>s.food?`Il manque ${k-s.food} 🍖`:'';}
function draw(s,n){for(let i=0;i<n;i++){if(!s.deck.length){if(!s.discard.length)return;s.deck=shuffle(s.discard);s.discard=[];}s.hand.push(s.deck.pop());}}

function setSprite(el,key,size,flip){el.innerHTML=`<img class="spr${flip?' flip':''}" src="${IMG.anim[key]}" style="width:${size}px">`;}
function newGame(){
  SFX.unlock();
  document.querySelectorAll('.over').forEach(e=>e.remove());
  document.querySelectorAll('.ko').forEach(e=>e.classList.remove('ko'));
  const oppPet=shuffle(Object.keys(CREATURES).slice())[0];
  me=makeSide(B,true);
  // deck IA cohérent avec sa famille
  opp=makeSide({pet:oppPet,avatar:'h2',top:'chemisette',bottom:'jean',deck:suggestedDeck(CREATURES[oppPet].f)},false);
  setSprite($('#myPet'),me.key,me.cr.size*1.08,true);
  setSprite($('#oppPet'),opp.key,opp.cr.size*.8,false);
  $('#myPote').innerHTML=`<img class="spr avatarknee" src="${IMG.avatarKnee[me.avatar]}">`;
  $('#oppPote').innerHTML=`<img class="spr" src="${IMG.oppPote}" style="width:84px"><span id="oppFront"></span>`;
  G={turn:1,active:null,busy:false,sel:null,over:false,pause:G?G.pause:false,fast:G?G.fast:false};
  startTurn(me);
}

async function startTurn(s){
  G.busy=true;G.active=s;G.sel=null;
  s.food=s.foodMax;s.foodPlayed=false;
  if(s.fx.poison){s.fx.poison--;SFX.poison();retrig(s.petEl,'hit',450);const pd=5;s.hp=Math.max(0,s.hp-pd);floatTxt(s.petEl,'-'+pd+' ☠️','#9be564');render();await sleep(600);if(await checkEnd())return;}
  if(s.fx.stun){s.fx.stun=0;await banner(s.isMe?'😵 TU ES SONNÉ !':'😵 ALEX EST SONNÉ !');render();return endTurn(true);}
  const n=HAND_DRAW-(s.fx.work?2:0);s.fx.work=0;draw(s,n);
  await banner(s.extra?'⚡ ENCORE UN TOUR !':(s.isMe?'À TOI !':'TOUR D\'ALEX'));
  s.extra=false;
  if(s.isMe){say(`Tour ${G.turn} : ${n} cartes. 1 nourriture max, garde tes grosses cartes en poche 👖`);G.busy=false;render();}
  else{render();await aiPlay();}
}
async function endTurn(skipDiscard){
  const s=G.active;if(G.over)return;
  G.busy=true;G.sel=null;
  if(s.isMe&&!skipDiscard&&s.hand.length){document.querySelectorAll('#hand .card').forEach(e=>e.classList.add('gone'));await sleep(220);}
  s.discard.push(...s.hand);s.hand=[];
  for(const k of ['eyes','slow','fear','haste'])if(s.fx[k])s.fx[k]--;
  render();
  if(s.extra){await flashFx(s.poteEl);return startTurn(s);}
  const n=other(s);if(n.isMe)G.turn++;
  startTurn(n);
}
async function waitContinue(){if(!G.pause)return;const b=$('#cont');b.style.display='block';await new Promise(r=>b.onclick=r);b.style.display='none';}

async function playCard(s,c,from){
  G.busy=true;G.sel=null;SFX.card();
  if(s.isMe){const el=document.querySelector(`#hand .card[data-id="${c.id}"]`);if(el){el.classList.add('played');await sleep(200);}}
  const list=from==='hand'?s.hand:s[from];list.splice(list.indexOf(c),1);
  render();
  if(!s.isMe)await reveal(c);
  const d=C(c),t=other(s);
  if(d.type==='food'){const g=Math.min(d.gain||1,FOOD_CAP-s.foodMax);s.foodPlayed=true;s.foodMax+=g;s.food+=g;SFX.food();
    say(`${s.name} pose ${d.n} : +${g} 🍖.`);if(s.isMe)retrig($('#tokFood'),'pop',500);render();await sleep(300);}
  else if(d.type==='soda'){s.soda++;s.discard.push(c);SFX.soda();say(`${s.name} boit un Soda (${s.soda}/${SODA_MAX}).`);render();
    if(s.soda>=SODA_MAX){s.soda=0;s.extra=true;say(`⚡ ${s.name} passe en FLASH !`);await flashFx(s.poteEl);}
    await sleep(250);}
  else{
    s.food-=costOf(s,c);render();
    const self=d.target==='self';
    const src=d.target==='pote'?s.poteEl:s.petEl,dst=self?s.petEl:(d.target==='pet'?t.petEl:t.poteEl);
    const bonus=famBonus(s,d);
    say(`${d.target==='pote'?s.name:(s.isMe?'Ton ':'Le ')+s.cr.n+(s.isMe?'':' d\'Alex')} lance ${d.n.toUpperCase()}${bonus?' ✨':''} !`);
    // GROSSE onomatopée d'abord pour les finishers
    if(d.big){bigOnomatopee(d.fx,d.col,s.isMe);await sleep(450);}
    await (ANIMS[d.anim]||ANIMS.slide)(src,dst,d,s.isMe);
    let miss=false;
    if(d.target==='pet'){
      if(s.fx.blind){s.fx.blind=0;if(Math.random()<.6)miss='RATÉ !';}
      if(!miss&&Math.random()<dodgeChance(s,t))miss='ESQUIVE !';
    }
    let log;
    if(miss){SFX.dodge();retrig(dst,'dodge',520);floatTxt(dst,miss,'#fff',1);log=miss==='ESQUIVE !'?`${t.cr.n} esquive ! (⚡${spd(t)} vs ⚡${spd(s)})`:`${s.cr.n} rate, aveuglé !`;}
    else{log=applyEffect(s,t,d,dst,bonus);if(!d.big)bigOnomatopee(d.fx,d.col,s.isMe);}
    say(log);render();s.discard.push(c);
    await sleep(miss?450:600);
    if(await checkEnd())return;
  }
  await waitContinue();
  G.busy=false;render();
}

function applyEffect(s,t,d,dst,bonus){
  const out=[],mul=bonus?1.5:1;
  if(d.dmg){let dmg=d.dmg*mul;
    if(d.phys)dmg*=s.cr.pow;
    if(hasT(s,'minuscule'))dmg*=.75;
    if(s.fx.fear)dmg/=2;
    if(hasT(t,'carapace'))dmg*=.7;
    dmg=Math.round(dmg);
    if(t.shield){const a=Math.min(t.shield,dmg);t.shield-=a;dmg-=a;if(a)floatTxt(dst,'🫧-'+a,'#80deea');}
    t.hp=Math.max(0,t.hp-dmg);
    const heavy=dmg>=18;SFX[heavy?'heavy':'hit']();
    retrig(dst,heavy?'hitBig':'hit',heavy?700:450);
    if(heavy){$('#phone').classList.add('bigshake');setTimeout(()=>$('#phone').classList.remove('bigshake'),450);}
    floatTxt(dst,'-'+dmg,heavy?'#ff1744':'#ff5252',heavy);
    out.push(`${dmg} dégâts${d.phys&&s.cr.pow>=1.4?' 💪 (gabarit !)':''}`);}
  if(d.poison){t.fx.poison=Math.round(d.poison*(mul>1?1.3:1));out.push(`poison ${t.fx.poison} tours`);}
  if(d.eyes){t.fx.eyes=d.eyes;floatTxt(dst,'😵 +1 coût','#ffa94d');out.push('sorts +1 coût');}
  if(d.slow){t.fx.slow=d.slow;floatTxt(dst,'🐌 -1⚡','#7fd8ff');out.push('ralenti');}
  if(d.blind){t.fx.blind=1;out.push('aveuglé');}
  if(d.fear){t.fx.fear=d.fear;floatTxt(dst,'😱','#ff8af5');out.push('dégâts /2');}
  if(d.work){t.fx.work=1;floatTxt(dst,'💼 -2','#90a4ae');out.push('pioche -2');}
  if(d.stun){t.fx.stun=1;floatTxt(dst,'💫 SONNÉ','#ce93d8');out.push('saute son tour');}
  if(d.heal){const h=Math.round(d.heal*mul);s.hp=Math.min(s.max,s.hp+h);floatTxt(s.petEl,'+'+h,'#34c759',1);out.push(`+${h} PV`);}
  if(d.cleanse){for(const k of ['poison','eyes','slow','blind','fear'])s.fx[k]=0;out.push('malus retirés');}
  if(d.shield){s.shield+=Math.round(d.shield*mul);out.push(`bouclier ${s.shield}`);}
  if(d.haste){s.fx.haste=d.haste;out.push('+2 vitesse');}
  if(d.draw){draw(s,d.draw);out.push(`pioche ${d.draw}`);}
  if(d.hole){const all=[...t.back.map(c=>['back',c]),...t.front.map(c=>['front',c])];
    if(all.length){const [z,c]=all[Math.random()*all.length|0];t[z].splice(t[z].indexOf(c),1);t.discard.push(c);floatTxt(dst,'🕳️','#b39ddb');out.push(`perd ${C(c).n}`);}
    else out.push('poches vides !');}
  return `${d.n} : ${out.join(', ')}.`;
}

function pocketCard(c){
  const z=me.back.length<me.backMax?'back':me.front.length<me.frontMax?'front':null;if(!z)return;
  me.hand.splice(me.hand.indexOf(c),1);me[z].push(c);G.sel=null;SFX.card();
  say(z==='back'?`${C(c).n} planquée en poche arrière 😏`:`${C(c).n} en poche avant… Alex la voit 👀`);render();
}
async function checkEnd(){
  if(me.hp>0&&opp.hp>0)return false;
  G.over=true;G.busy=true;render();
  const win=opp.hp<=0;(win?opp.petEl:me.petEl).classList.add('ko');SFX[win?'win':'lose']();
  bigOnomatopee(win?'K.O. !':'AÏE…',win?'#ffd633':'#7e57c2',win);await sleep(1100);
  const o=document.createElement('div');o.className='over';
  o.innerHTML=`<div class="bg">${win?'VICTOIRE':'DÉFAITE'}</div><div>${win?'Alex est humilié 🏆':'Ton '+me.cr.n+' est KO 😵'} · ${G.turn} tours</div>
    <button id="again">REJOUER</button><button id="rebuild">CHANGER MON DECK</button>`;
  $('#phone').appendChild(o);
  $('#again').onclick=newGame;
  $('#rebuild').onclick=()=>{o.remove();$('#fight').classList.remove('on');$('#build').classList.add('on');renderBuild();};
  return true;
}
async function aiPlay(){
  await sleep(300);
  const f=opp.hand.find(c=>C(c).type==='food'&&!whyNot(opp,c));if(f){await playCard(opp,f,'hand');if(G.over)return;}
  for(let g=0;g<8;g++){
    const pool=[...opp.hand.map(c=>[c,'hand']),...opp.back.map(c=>[c,'back']),...opp.front.map(c=>[c,'front'])]
      .filter(([c])=>C(c).type!=='food'&&!whyNot(opp,c)&&!(C(c).heal&&opp.hp>opp.max-14&&!C(c).draw));
    if(!pool.length)break;
    pool.sort(([a],[b])=>(C(b).type==='soda')-(C(a).type==='soda')||costOf(opp,b)-costOf(opp,a));
    await playCard(opp,pool[0][0],pool[0][1]);if(G.over)return;
  }
  const heavy=opp.hand.filter(c=>C(c).type==='spell').sort((a,b)=>costOf(opp,b)-costOf(opp,a));
  for(const h of heavy){const z=opp.back.length<opp.backMax?'back':opp.front.length<opp.frontMax?'front':null;if(!z)break;
    opp.hand.splice(opp.hand.indexOf(h),1);opp[z].push(h);say(z==='back'?'Alex planque une carte 🤨':`Alex met ${C(h).n} en poche avant 👀`);render();await sleep(400);}
  await sleep(220);endTurn();
}
