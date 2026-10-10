// ===== MOTEUR v3 =====
let G=null,me,opp,uid=0;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const C=c=>CARDS[c.key];
const other=s=>s===me?opp:me;
const hasT=(s,t)=>s.cr.t&&s.cr.t.includes(t);

function makeSide(cfg,isMe){
  const cr=CREATURES[cfg.pet],top=TOPS[cfg.top],bot=BOTTOMS[cfg.bottom],deck=[];
  for(const k in cfg.deck)for(let i=0;i<cfg.deck[k];i++)deck.push({id:++uid,key:k});
  const hp=cr.hp+top.hp;
  return {isMe,key:cfg.pet,cr,hp,max:hp,deck:shuffle(deck),hand:[],discard:[],back:[],front:[],backMax:bot.back,frontMax:top.front,
    food:0,foodMax:0,soda:0,foodPlayed:false,extra:false,shield:0,
    fx:{poison:0,eyes:0,slow:0,blind:0,fear:0,work:0,haste:0,stun:0},
    petEl:$(isMe?'#myPet':'#oppPet'),poteEl:$(isMe?'#myPote':'#oppPote'),name:isMe?'Toi':'Alex'};
}
const spd=s=>Math.max(1,s.cr.spd-(s.fx.slow?1:0)+(s.fx.haste?2:0));
const famOk=(s,d)=>d.fam&&d.fam===s.cr.f;
const costOf=(s,c)=>{const d=C(c);return Math.max(0,(d.cost||0)+(s.fx.eyes?1:0)-(famOk(s,d)?1:0));};
// esquive : 10% à égalité, +16%/point d'écart, max 90%. Les énormes ne peuvent pas être esquivés (trop gros) mais esquivent mal.
function dodgeChance(atk,def){if(hasT(atk,'enorme'))return 0;let p=.1+(spd(def)-spd(atk))*.16;if(hasT(def,'minuscule'))p+=.1;return Math.min(.9,Math.max(.03,p));}
function whyNot(s,c){const d=C(c);
  if(d.type==='food')return s.foodPlayed?'Déjà 1 nourriture ce tour':s.foodMax>=FOOD_CAP?'Gamelle pleine (max 8)':'';
  if(d.type==='soda')return '';
  const k=costOf(s,c);return k>s.food?`Il manque ${k-s.food} 🍖`:'';}
function draw(s,n){for(let i=0;i<n;i++){if(!s.deck.length){if(!s.discard.length)return;s.deck=shuffle(s.discard);s.discard=[];}s.hand.push(s.deck.pop());}}

function setSprite(el,key,size,flip){el.innerHTML=`<img class="spr${flip?' flip':''}" src="${IMG[key]}" style="width:${size}px">`;}
function newGame(){
  SFX.unlock();
  document.querySelectorAll('.over').forEach(e=>e.remove());
  document.querySelectorAll('.ko').forEach(e=>e.classList.remove('ko'));
  const pool=Object.keys(CREATURES);const oppPet=shuffle(pool.slice())[0];
  me=makeSide(B,true);
  // l'IA reçoit un deck adapté à sa famille
  const od=Object.assign({},DEFAULT_DECK);const fc={poils:'griffe',ecailles:'venin',aqua:'tsunami',plumes:'fiente'}[CREATURES[oppPet].f];
  od.griffe=0;od[fc]=(od[fc]||0)+2;od.morsure=3;
  opp=makeSide({pet:oppPet,top:'chemisette',bottom:'jean',deck:od},false);
  setSprite($('#myPet'),me.key,me.cr.size*1.05,true);
  setSprite($('#oppPet'),opp.key,opp.cr.size*.72,false);
  $('#myPote').innerHTML=`<img class="spr" src="${IMG.myPote}" style="width:150px">`;
  $('#oppPote').innerHTML=`<img class="spr" src="${IMG.oppPote}" style="width:82px"><span id="oppFront"></span>`;
  G={turn:1,active:null,busy:false,sel:null,over:false,pause:G?G.pause:false,fast:G?G.fast:false};
  startTurn(me);
}

async function startTurn(s){
  G.busy=true;G.active=s;G.sel=null;
  s.food=s.foodMax;s.foodPlayed=false;
  if(s.fx.poison){s.fx.poison--;SFX.poison();retrig(s.petEl,'hit',450);s.hp=Math.max(0,s.hp-4);floatTxt(s.petEl,'-4 ☠️','#9be564');render();await sleep(600);if(await checkEnd())return;}
  if(s.fx.stun){s.fx.stun=0;await banner(s.isMe?'😵 TU ES SONNÉ !':'😵 ALEX EST SONNÉ !');render();return endTurn(true);}
  const n=HAND_DRAW-(s.fx.work?2:0);s.fx.work=0;draw(s,n);
  await banner(s.extra?'⚡ ENCORE UN TOUR !':(s.isMe?'À TOI !':'TOUR D\'ALEX'));
  s.extra=false;
  if(s.isMe){say(`Tour ${G.turn} : ${n} cartes piochées. 1 nourriture max, garde tes grosses cartes en poche 👖`);G.busy=false;render();}
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
  if(d.type==='food'){const k=Math.min(d.food||1,FOOD_CAP-s.foodMax);s.foodPlayed=true;s.foodMax+=k;s.food+=k;SFX.food();
    say(`${s.name} pose ${d.n} : +${k} 🍖.`);if(s.isMe)retrig($('#tokFood'),'pop',500);render();await sleep(300);}
  else if(d.type==='soda'){s.soda++;s.discard.push(c);SFX.soda();say(`${s.name} boit un Soda (${s.soda}/${SODA_MAX}).`);render();
    if(s.soda>=SODA_MAX){s.soda=0;s.extra=true;await flashFx(s.poteEl);say(`⚡ ${s.name} passe en FLASH : il rejouera juste après !`);}
    await sleep(250);}
  else{
    s.food-=costOf(s,c);render();
    const self=d.target==='self';
    const src=d.target==='pote'?s.poteEl:s.petEl,dst=self?s.petEl:(d.target==='pet'?t.petEl:t.poteEl);
    say(`${d.target==='pote'?s.name:(s.isMe?'Ton ':'Le ')+s.cr.n+(s.isMe?'':' d\'Alex')} lance ${d.n.toUpperCase()}${famOk(s,d)?' ✨':''} !`);
    if(d.big){speedStrip(d.col,s.isMe);aceBubble(d.fx,d.col,s.isMe,true);await sleep(500);}
    // 1) attaque animée
    await (ANIMS[d.anim]||ANIMS.bite)(src,dst,d);
    let miss=false;
    if(d.target==='pet'){
      if(s.fx.blind){s.fx.blind=0;if(Math.random()<.6)miss='RATÉ !';}
      if(!miss&&Math.random()<dodgeChance(s,t))miss='ESQUIVE !';
    }
    let log;
    if(miss){SFX.dodge();retrig(dst,'dodge',520);floatTxt(dst,miss,'#fff');log=miss==='ESQUIVE !'?`${t.cr.n} esquive ! (⚡${spd(t)} contre ⚡${spd(s)})`:`${s.cr.n} est aveuglé et rate !`;}
    else{log=applyEffect(s,t,d,dst);
      // 2) PUIS la bulle comics (petite, dans le coin)
      if(!d.big)aceBubble(d.fx,d.col,s.isMe,false);}
    say(log);render();
    s.discard.push(c);
    await sleep(miss?450:650);
    if(await checkEnd())return;
  }
  await waitContinue();
  G.busy=false;render();
}

function applyEffect(s,t,d,dst){
  const out=[],mul=famOk(s,d)?1.5:1;
  if(d.dmg){let dmg=d.dmg*mul;
    if(d.phys)dmg*=s.cr.pow;
    if(hasT(s,'minuscule'))dmg*=.75;
    if(s.fx.fear)dmg/=2;
    if(hasT(t,'carapace'))dmg*=.75;
    dmg=Math.round(dmg);
    if(t.shield){const a=Math.min(t.shield,dmg);t.shield-=a;dmg-=a;if(a)floatTxt(dst,'🫧-'+a,'#80deea');}
    t.hp=Math.max(0,t.hp-dmg);
    const heavy=dmg>=20;
    SFX[heavy?'heavy':'hit']();
    retrig(dst,heavy?'hitBig':'hit',heavy?700:450);
    if(heavy){$('#phone').classList.add('bigshake');setTimeout(()=>$('#phone').classList.remove('bigshake'),450);}
    floatTxt(dst,'-'+dmg,heavy?'#ff1744':'#ff5252',heavy);
    out.push(`${dmg} dégâts${d.phys&&s.cr.pow>1.2?' (gros gabarit !)':''}`);}
  if(d.poison){t.fx.poison=Math.round(d.poison*(mul>1?1.5:1));out.push(`poison ${t.fx.poison} tours`);}
  if(d.eyes){t.fx.eyes=d.eyes;floatTxt(dst,'😵 +1 coût','#ffa94d');out.push('ses sorts coûtent +1');}
  if(d.slow){t.fx.slow=d.slow;floatTxt(dst,'🐌 -1⚡','#7fd8ff');out.push('ralenti');}
  if(d.blind){t.fx.blind=1;out.push('aveuglé');}
  if(d.fear){t.fx.fear=d.fear;floatTxt(dst,'😱','#ff8af5');out.push('dégâts /2');}
  if(d.work){t.fx.work=1;floatTxt(dst,'💼 -2 cartes','#90a4ae');out.push('pioche -2');}
  if(d.stun){t.fx.stun=1;floatTxt(dst,'💫 SONNÉ','#ce93d8');out.push('saute son tour');}
  if(d.heal){const h=Math.round(d.heal*mul);s.hp=Math.min(s.max,s.hp+h);floatTxt(s.petEl,'+'+h,'#34c759');out.push(`+${h} PV`);}
  if(d.cleanse){for(const k of ['poison','eyes','slow','blind','fear'])s.fx[k]=0;out.push('malus retirés');}
  if(d.shield){s.shield+=Math.round(d.shield*mul);out.push(`bouclier ${s.shield}`);}
  if(d.haste){s.fx.haste=d.haste;out.push('+2 vitesse');}
  if(d.draw){draw(s,d.draw);out.push(`pioche ${d.draw}`);}
  if(d.hole){const all=[...t.back.map(c=>['back',c]),...t.front.map(c=>['front',c])];
    if(all.length){const [z,c]=all[Math.random()*all.length|0];t[z].splice(t[z].indexOf(c),1);t.discard.push(c);floatTxt(dst,'🕳️ '+C(c).n,'#b39ddb');out.push(`perd ${C(c).n}`);}
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
  aceBubble(win?'K.O. !':'AÏE…',win?'#ffd633':'#7e57c2',win,true);await sleep(1300);
  const o=document.createElement('div');o.className='over';
  o.innerHTML=`<div class="bg">${win?'VICTOIRE':'DÉFAITE'}</div><div>${win?'Alex est humilié 🏆':'Ton '+me.cr.n+' est KO 😵'} · ${G.turn} tours</div>
    <button id="again">REJOUER</button><button id="rebuild">CHANGER MON DECK</button>`;
  $('#phone').appendChild(o);
  $('#again').onclick=newGame;
  $('#rebuild').onclick=()=>{o.remove();$('#fight').classList.remove('on');$('#build').classList.add('on');renderBuild();};
  return true;
}

// IA : nourriture, soda, gros sorts d'abord, garde en poche ce qu'elle ne peut pas payer
async function aiPlay(){
  await sleep(300);
  const f=opp.hand.find(c=>C(c).type==='food'&&!whyNot(opp,c));if(f){await playCard(opp,f,'hand');if(G.over)return;}
  for(let g=0;g<8;g++){
    const pool=[...opp.hand.map(c=>[c,'hand']),...opp.back.map(c=>[c,'back']),...opp.front.map(c=>[c,'front'])]
      .filter(([c])=>C(c).type!=='food'&&!whyNot(opp,c)&&!(C(c).heal&&opp.hp>opp.max-12&&!C(c).draw));
    if(!pool.length)break;
    pool.sort(([a],[b])=>(C(b).type==='soda')-(C(a).type==='soda')||costOf(opp,b)-costOf(opp,a));
    await playCard(opp,pool[0][0],pool[0][1]);if(G.over)return;
  }
  const heavy=opp.hand.filter(c=>C(c).type==='spell').sort((a,b)=>costOf(opp,b)-costOf(opp,a));
  for(const h of heavy){const z=opp.back.length<opp.backMax?'back':opp.front.length<opp.frontMax?'front':null;if(!z)break;
    opp.hand.splice(opp.hand.indexOf(h),1);opp[z].push(h);say(z==='back'?'Alex glisse une carte dans sa poche arrière… 🤨':`Alex met ${C(h).n} dans sa poche avant 👀`);render();await sleep(450);}
  await sleep(250);
  endTurn();
}
