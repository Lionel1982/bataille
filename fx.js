// ===== EFFETS VISUELS v4 : glissade, onomatopées géantes Ace Attorney, flash Quicksilver =====
const sleep=ms=>new Promise(r=>setTimeout(r,ms*(G&&G.fast?.55:1)));
const scene=()=>$('#scene');
function ctr(el){const r=el.getBoundingClientRect(),p=scene().getBoundingClientRect();return{x:r.left-p.left+r.width/2,y:r.top-p.top+r.height/2};}
function retrig(el,c,ms){el.classList.remove(c);void el.offsetWidth;el.classList.add(c);setTimeout(()=>el.classList.remove(c),ms);}
function addFx(html,cls,x,y,ms){const e=document.createElement('div');e.className='fx '+cls;e.innerHTML=html;e.style.left=x+'px';e.style.top=y+'px';scene().appendChild(e);if(ms)setTimeout(()=>e.remove(),ms);return e;}
function floatTxt(el,t,col,big){const p=ctr(el);addFx(t,'float'+(big?' huge':''),p.x,p.y-30,1300).style.color=col;}
async function banner(t){const b=document.createElement('div');b.className='banner';b.innerHTML='<span>'+t+'</span>';$('#phone').appendChild(b);SFX.turn();await sleep(750);b.remove();}

// ---- Onomatopée GÉANTE style Ace Attorney : texte en perspective + fond triangles bleus ----
function triangleBg(col){const t=[];for(let i=0;i<16;i++){const x=Math.random()*100,y=Math.random()*100,s=8+Math.random()*20,r=Math.random()*360;
  t.push(`<polygon points="0,-${s} ${s*.9},${s*.6} -${s*.9},${s*.6}" fill="${col}" opacity="${.25+Math.random()*.5}" transform="translate(${x} ${y}) rotate(${r}) scale(${.5+Math.random()})"/>`);}
  return `<svg class="tribg" viewBox="0 0 100 100" preserveAspectRatio="none">${t.join('')}</svg>`;}
function bigOnomatopee(word,col,isMe){
  SFX.objection();
  const o=document.createElement('div');o.className='boom';
  o.innerHTML=triangleBg(col)+`<div class="rays ${isMe?'L':'R'}"></div><div class="bword ${isMe?'fromL':'fromR'}" style="color:${col}">${word}</div>`;
  scene().appendChild(o);
  setTimeout(()=>o.classList.add('out'),700);
  setTimeout(()=>o.remove(),1050);
}

// ---- GLISSADE : l'attaquant traverse l'écran vers la cible, traits de vitesse derrière ----
async function slideAttack(src,dst,col,isMe){
  const a=ctr(src),b=ctr(dst),dx=b.x-a.x,dy=b.y-a.y;
  // traînée de vitesse
  const strip=addFx('','slidetrail',a.x,a.y,700);strip.style.setProperty('--c',col);
  strip.style.width=Math.hypot(dx,dy)+'px';strip.style.transform=`translate(0,-50%) rotate(${Math.atan2(dy,dx)}rad)`;
  strip.style.transformOrigin='0 50%';
  // l'animal fonce
  src.style.zIndex=20;
  src.animate([{transform:'none'},{transform:`translate(${dx*.5}px,${dy*.5}px) scale(1.18)`,offset:.35},
    {transform:`translate(${dx}px,${dy}px) scale(1.1)`,offset:.6},{transform:'none'}],{duration:520,easing:'cubic-bezier(.5,0,.3,1)'});
  SFX.whoosh&&SFX.whoosh();
  await sleep(330);
  setTimeout(()=>src.style.zIndex='',300);
}
async function travel(src,dst){const a=ctr(src),b=ctr(dst);
  src.animate([{transform:'none'},{transform:`translate(${(b.x-a.x)*.5}px,${(b.y-a.y)*.5}px) scale(1.12)`,offset:.5},{transform:'none'}],{duration:420,easing:'ease-in-out'});await sleep(220);}

const ANIMS={
  async slide(src,dst,d,isMe){await slideAttack(src,dst,d.col,isMe);const p=ctr(dst);
    addFx(`<svg viewBox="-100 -70 200 140"><polygon points="${spikes(14,78,42)}" fill="#fff" stroke="#111" stroke-width="6"/></svg>`,'impact',p.x,p.y,500);SFX.bite();await sleep(260);},
  async gas(src,dst,d){SFX.gas();const a=ctr(src),b=ctr(dst);
    for(let i=0;i<8;i++){const c=addFx('','cloud',a.x,a.y,1000);c.style.setProperty('--c',d.col);
      c.animate([{left:a.x+'px',top:a.y+'px',opacity:.9,transform:'translate(-50%,-50%) scale(.3)'},{left:(b.x+(Math.random()-.5)*70)+'px',top:(b.y+(Math.random()-.5)*40)+'px',opacity:0,transform:`translate(-50%,-50%) scale(${1.4+Math.random()})`}],{duration:850,delay:i*55,easing:'ease-out',fill:'forwards'});}
    await sleep(600);},
  async splash(src,dst,d){const a=ctr(src),b=ctr(dst);SFX.splash();
    for(let i=0;i<10;i++){const g=addFx('','drop',a.x,a.y,750);g.style.background=d.col;
      g.animate([{left:a.x+'px',top:a.y+'px'},{left:(b.x+(Math.random()-.5)*55)+'px',top:(b.y+(Math.random()-.5)*34)+'px'}],{duration:360,delay:i*22,easing:'cubic-bezier(.3,0,.6,1)',fill:'forwards'});}
    await sleep(400);const p=ctr(dst);addFx('','splat',p.x,p.y,700).style.background=d.col;},
  async taunt(src,dst,d){SFX.taunt();retrig(src,'taunt',700);const p=ctr(src);addFx(d.art,'emoBig',p.x,p.y-50,800);await sleep(500);},
  async dive(src,dst,d,isMe){const a=ctr(src),b=ctr(dst);SFX.dive();
    src.animate([{transform:'none'},{transform:`translate(${(b.x-a.x)*.3}px,-150px) rotate(-20deg)`,offset:.4},{transform:`translate(${b.x-a.x}px,${b.y-a.y}px) rotate(30deg)`,offset:.8},{transform:'none'}],{duration:680,easing:'ease-in'});
    await sleep(560);const p=ctr(dst);addFx('','splat',p.x,p.y,600).style.background=d.col;},
  async heal(src,dst,d){SFX.heal();const p=ctr(src);for(let i=0;i<9;i++){const h=addFx(d.art,'rise',p.x+(Math.random()-.5)*80,p.y+20,900);h.style.animationDelay=i*55+'ms';}
    addFx('','ring',p.x,p.y,700).style.borderColor=d.col;await sleep(500);},
  async nuke(src,dst,d){const p=ctr(dst);SFX.nuke();scene().classList.add('zoom');
    addFx('','mushroom',p.x,p.y,1400);scene().classList.add('greenflash');$('#phone').classList.add('bigshake');
    await sleep(900);$('#phone').classList.remove('bigshake');scene().classList.remove('greenflash','zoom');}
};
function spikes(n,R,r){const p=[];for(let i=0;i<n*2;i++){const a=Math.PI*i/n,k=(i%2?r:R)*(.85+Math.random()*.3);p.push((Math.cos(a)*k*1.4).toFixed(0)+','+(Math.sin(a)*k).toFixed(0));}return p.join(' ');}

// ---- FLASH façon Quicksilver : l'avatar court partout très vite, traînée, horloge au ralenti ----
async function flashFx(poteEl){
  SFX.flash();
  scene().classList.add('slowmo');
  const base=ctr(poteEl);
  const spots=[[40,250],[300,120],[180,70],[60,120],[330,260],[200,200],[120,300],[300,300]];
  const runner=document.createElement('div');runner.className='fx quicksilver';
  runner.innerHTML=`<img src="${IMG.quickRun||IMG.avatarKnee[B.avatar]}" style="width:70px">`;
  runner.style.left=base.x+'px';runner.style.top=base.y+'px';scene().appendChild(runner);
  addFx('⚡ FLASH ! ⚡','float huge',base.x,base.y-60,1900).style.color='#ffeb3b';
  for(let i=0;i<spots.length;i++){const [x,y]=spots[i];
    // traînée fantôme
    const ghost=addFx(`<img src="${IMG.avatarKnee[B.avatar]}" style="width:60px;opacity:.4">`,'ghost',runner.offsetLeft,runner.offsetTop,400);
    runner.animate([{left:runner.offsetLeft+'px',top:runner.offsetTop+'px'},{left:x+'px',top:y+'px'}],{duration:150,fill:'forwards',easing:'linear'});
    runner.style.left=x+'px';runner.style.top=y+'px';
    SFX.whoosh&&SFX.whoosh();
    await sleep(150);
  }
  runner.animate([{opacity:1},{opacity:0}],{duration:200,fill:'forwards'});
  await sleep(250);runner.remove();scene().classList.remove('slowmo');
}
