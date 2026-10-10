// ===== EFFETS VISUELS v3 : variés, rapides, sans recouvrir la scène =====
const sleep=ms=>new Promise(r=>setTimeout(r,ms*(G&&G.fast?.55:1)));
const scene=()=>$('#scene');
function ctr(el){const r=el.getBoundingClientRect(),p=scene().getBoundingClientRect();return{x:r.left-p.left+r.width/2,y:r.top-p.top+r.height/2};}
function retrig(el,c,ms){el.classList.remove(c);void el.offsetWidth;el.classList.add(c);setTimeout(()=>el.classList.remove(c),ms);}
function addFx(html,cls,x,y,ms){const e=document.createElement('div');e.className='fx '+cls;e.innerHTML=html;e.style.left=x+'px';e.style.top=y+'px';scene().appendChild(e);setTimeout(()=>e.remove(),ms);return e;}
function floatTxt(el,t,col,big){const p=ctr(el);addFx(t,'float'+(big?' huge':''),p.x,p.y-30,1300).style.color=col;}
async function banner(t){const b=document.createElement('div');b.className='banner';b.innerHTML='<span>'+t+'</span>';$('#phone').appendChild(b);SFX.turn();await sleep(750);b.remove();}
function spikes(n,R,r){const p=[];for(let i=0;i<n*2;i++){const a=Math.PI*i/n,k=(i%2?r:R)*(.85+Math.random()*.3);p.push((Math.cos(a)*k*1.5).toFixed(0)+','+(Math.sin(a)*k).toFixed(0));}return p.join(' ');}

// Bulle Ace Attorney : PETITE, dans le coin, ne bloque rien
function aceBubble(word,col,isMe,big){
  SFX.objection();
  const o=document.createElement('div');o.className='aab '+(isMe?'L':'R')+(big?' big':'');
  o.innerHTML=`<svg viewBox="-150 -90 300 180"><polygon points="${spikes(13,82,55)}" fill="#fff" stroke="#111" stroke-width="8"/></svg><b style="color:${col}">${word}</b>`;
  scene().appendChild(o);setTimeout(()=>o.remove(),big?1500:1050);
}
// Lignes de vitesse uniquement derrière l'attaquant (bande)
function speedStrip(col,isMe){const s=document.createElement('div');s.className='strip '+(isMe?'me':'op');s.style.setProperty('--c',col);scene().appendChild(s);setTimeout(()=>s.remove(),600);}

// Une animation par famille d'attaque
const ANIMS={
  async bite(src,dst,d){await travel(src,dst,'lunge');const p=ctr(dst);addFx('<i class="jawT"></i><i class="jawB"></i>','jaws',p.x,p.y,500);SFX.bite();await sleep(330);},
  async slash(src,dst){await travel(src,dst,'lunge');const p=ctr(dst);for(let i=0;i<3;i++)addFx('','claw',p.x-20+i*18,p.y,450);SFX.slash();await sleep(300);},
  async gas(src,dst,d){SFX.gas();const a=ctr(src),b=ctr(dst);
    for(let i=0;i<7;i++){const c=addFx('','cloud',a.x,a.y,1100);c.style.setProperty('--c',d.col);
      c.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:.9},{transform:`translate(${b.x-a.x+(Math.random()-.5)*60-50}%,${b.y-a.y}px) scale(${1+Math.random()})`,opacity:0}],{duration:900,delay:i*60,easing:'ease-out',fill:'forwards'});
      c.style.transform='translate(-50%,-50%)';
      c.animate([{left:a.x+'px',top:a.y+'px'},{left:(b.x+(Math.random()-.5)*70)+'px',top:(b.y+(Math.random()-.5)*40)+'px'}],{duration:800,delay:i*60,easing:'ease-out',fill:'forwards'});}
    await sleep(650);},
  async splash(src,dst,d){const a=ctr(src),b=ctr(dst);SFX.splash();
    for(let i=0;i<9;i++){const g=addFx('','drop',a.x,a.y,800);g.style.background=d.col;
      g.animate([{left:a.x+'px',top:a.y+'px'},{left:(b.x+(Math.random()-.5)*50)+'px',top:(b.y+(Math.random()-.5)*30)+'px'}],{duration:380,delay:i*25,easing:'cubic-bezier(.3,0,.6,1)',fill:'forwards'});}
    await sleep(420);const p=ctr(dst);addFx('','splat',p.x,p.y,700).style.background=d.col;},
  async taunt(src,dst,d){SFX.taunt();retrig(src,'taunt',700);const p=ctr(src);addFx(d.art,'emoBig',p.x,p.y-50,800);await sleep(500);},
  async dive(src,dst){const a=ctr(src),b=ctr(dst);SFX.dive();
    src.animate([{transform:'none'},{transform:`translate(${(b.x-a.x)*.3}px,-140px) rotate(-20deg)`,offset:.4},{transform:`translate(${b.x-a.x}px,${b.y-a.y}px) rotate(30deg)`,offset:.8},{transform:'none'}],{duration:700,easing:'ease-in'});
    await sleep(560);},
  async heal(src,dst,d){SFX.heal();const p=ctr(src);for(let i=0;i<8;i++){const h=addFx(d.art,'rise',p.x+(Math.random()-.5)*80,p.y+20,900);h.style.animationDelay=i*60+'ms';}
    addFx('','ring',p.x,p.y,700).style.borderColor=d.col;await sleep(500);},
  async charge(src,dst,d){const a=ctr(src),b=ctr(dst);
    // le gros prend son élan, l'écran rétrécit, puis IMPACT
    src.animate([{transform:'none'},{transform:'translate(-30px,15px) scale(.92)',offset:.35},{transform:`translate(${b.x-a.x}px,${b.y-a.y}px) scale(1.25)`,offset:.75},{transform:'none'}],{duration:850,easing:'ease-in'});
    $('#scene').classList.add('zoom');await sleep(600);SFX.heavy();
    const p=ctr(dst);addFx(`<svg viewBox="-150 -90 300 180"><polygon points="${spikes(16,85,40)}" fill="#ffeb3b" stroke="#111" stroke-width="6"/></svg>`,'impact',p.x,p.y,600);
    for(let i=0;i<10;i++){const r=addFx('','rock',p.x,p.y,800);const an=Math.random()*6.28;r.animate([{transform:'translate(-50%,-50%)'},{transform:`translate(${Math.cos(an)*110}px,${Math.sin(an)*80-30}px) rotate(400deg)`,opacity:0}],{duration:700,easing:'ease-out',fill:'forwards'});}
    $('#phone').classList.add('bigshake');setTimeout(()=>{$('#phone').classList.remove('bigshake');$('#scene').classList.remove('zoom');},500);await sleep(300);},
  async nuke(src,dst,d){const p=ctr(dst);SFX.nuke();$('#scene').classList.add('zoom');
    addFx('','mushroom',p.x,p.y,1400);$('#scene').classList.add('greenflash');$('#phone').classList.add('bigshake');
    await sleep(900);$('#phone').classList.remove('bigshake');$('#scene').classList.remove('greenflash','zoom');}
};
async function travel(src,dst,kind){const a=ctr(src),b=ctr(dst);
  src.animate([{transform:'none'},{transform:`translate(${(b.x-a.x)*.55}px,${(b.y-a.y)*.55}px) scale(1.12)`,offset:.5},{transform:'none'}],{duration:420,easing:'ease-in-out'});await sleep(220);}

async function flashFx(el){SFX.flash();retrig(el,'flash',1400);floatTxt(el,'⚡ FLASH !','#ffeb3b',1);await sleep(1100);}
