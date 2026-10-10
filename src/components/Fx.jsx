import { forwardRef, useImperativeHandle, useRef } from 'react'
import { actionArt } from '../game/actionArt.js'
import { IMG } from '../assets/images.js'
import { SFX } from '../game/sfx.js'
import { CARD, famBonus } from '../game/engine.js'

// Composant qui pilote TOUS les effets visuels de la scène de combat.
// Battle.jsx appelle fx.current.attack(...), .result(...), .flash(...), etc.
const Fx = forwardRef(function Fx({ getG, dMul, pausedRef }, ref){
  const layer = useRef(null)
  const sleep = ms => new Promise(r=>setTimeout(r, ms*dMul()))
  const el = id => document.getElementById(id)
  const sceneEl = () => el('scene')

  function center(node){
    const r=node.getBoundingClientRect(), p=sceneEl().getBoundingClientRect()
    return { x:r.left-p.left+r.width/2, y:r.top-p.top+r.height/2 }
  }
  function spawn(cls, html, x, y, ms){
    const e=document.createElement('div'); e.className='fx '+cls; e.innerHTML=html||''
    e.style.left=x+'px'; e.style.top=y+'px'; sceneEl().appendChild(e)
    if(ms) setTimeout(()=>e.remove(), ms)
    return e
  }
  function retrig(node, cls, ms){ node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); setTimeout(()=>node.classList.remove(cls), ms) }
  const petNode = who => el(who==='me'?'myPet':'oppPet')
  const poteNode = who => el(who==='me'?'myPote':'oppPote')

  function spikes(n,R,r){ const p=[]; for(let i=0;i<n*2;i++){ const a=Math.PI*i/n, k=(i%2?r:R)*(.85+Math.random()*.3); p.push((Math.cos(a)*k*1.4).toFixed(0)+','+(Math.sin(a)*k).toFixed(0)) } return p.join(' ') }
  function triangleBg(col){ const t=[]; for(let i=0;i<16;i++){ const x=Math.random()*100,y=Math.random()*100,s=8+Math.random()*20,r=Math.random()*360; t.push(`<polygon points="0,-${s} ${s*.9},${s*.6} -${s*.9},${s*.6}" fill="${col}" opacity="${.25+Math.random()*.5}" transform="translate(${x} ${y}) rotate(${r}) scale(${.5+Math.random()})"/>`) } return `<svg class="tribg" viewBox="0 0 100 100" preserveAspectRatio="none">${t.join('')}</svg>` }

  const api = {
    sfx:(k)=>SFX[k]&&SFX[k](),
    toggleSound:()=>SFX.toggle(),
    float:(who,txt,col,big)=>{ const p=center(petNode(who)); const f=spawn('float'+(big?' huge':''),txt,p.x,p.y-30,1300); f.style.color=col },
    hit:(who)=>{ retrig(petNode(who),'hit',450) },
    dodge:(who)=>{ retrig(petNode(who),'dodge',520) },
    ko:(who)=>{ petNode(who).classList.add('ko') },
    async banner(t){ const b=document.createElement('div'); b.className='banner'; b.innerHTML='<span>'+t+'</span>'; el('scene').parentElement.appendChild(b); SFX.turn&&SFX.turn(); await sleep(750); b.remove() },

    // Onomatopée GÉANTE style Ace Attorney : triangles bleus + texte en perspective
    bigWord(word,col,isMe){
      SFX.objection&&SFX.objection()
      const o=document.createElement('div'); o.className='boom'
      o.innerHTML=triangleBg(col)+`<div class="rays ${isMe?'L':'R'}"></div><div class="bword ${isMe?'fromL':'fromR'}" style="color:${col}">${word}</div>`
      sceneEl().appendChild(o)
      setTimeout(()=>o.classList.add('out'),700); setTimeout(()=>o.remove(),1050)
      return sleep(500)
    },

    // Attaque = glissade de l'attaquant + onomatopée géante + dessin d'action
    async attack(attacker, target, card){
      const srcWho = attacker.isMe?'me':'opp'
      const src = card.target==='pote'? poteNode(srcWho) : petNode(srcWho)
      const dstWho = target.isMe?'me':'opp'
      const dst = (card.target==='self') ? petNode(srcWho) : (card.target==='pote'? poteNode(dstWho) : petNode(dstWho))
      // dessin d'action
      const art = actionArt(card._key)
      if(art){ const a=spawn('actionart','<img src="'+art+'">', 0,0, 0); a.style.left='50%'; a.style.top='46%'; setTimeout(()=>{a.classList.add('out'); setTimeout(()=>a.remove(),300)}, 650) }
      // onomatopée (grande pour les finishers, sinon normale mais toujours visible)
      this.bigWord(card.fx, card.col, attacker.isMe)
      // glissade
      const a=center(src), b=center(dst), dx=b.x-a.x, dy=b.y-a.y
      const strip=spawn('slidetrail','',a.x,a.y,700); strip.style.setProperty('--c',card.col)
      strip.style.width=Math.hypot(dx,dy)+'px'; strip.style.transformOrigin='0 50%'; strip.style.transform=`translate(0,-50%) rotate(${Math.atan2(dy,dx)}rad)`
      src.style.zIndex=20
      src.animate([{transform:'none'},{transform:`translate(${dx*.5}px,${dy*.5}px) scale(1.16)`,offset:.4},{transform:`translate(${dx}px,${dy}px) scale(1.08)`,offset:.65},{transform:'none'}],{duration:520*dMul(),easing:'cubic-bezier(.5,0,.3,1)'})
      SFX.whoosh&&SFX.whoosh()
      await sleep(330)
      setTimeout(()=>src.style.zIndex='',250)
    },

    // Résultat des dégâts/soins (après résolution)
    result(attacker, target, res){
      const dstWho = res.heal ? (attacker.isMe?'me':'opp') : (target.isMe?'me':'opp')
      if(res.heal){ this.float(dstWho,'+'+res.heal,'#34c759',true); const p=center(petNode(dstWho)); const ring=spawn('ring','',p.x,p.y,700); ring.style.borderColor='#34c759' }
      if(res.dmg){ const heavy=res.dmg>=18; SFX[heavy?'heavy':'hit']&&SFX[heavy?'heavy':'hit']()
        retrig(petNode(dstWho), heavy?'hitBig':'hit', heavy?700:450)
        if(heavy){ el('scene').parentElement.classList.add('bigshake'); setTimeout(()=>el('scene').parentElement.classList.remove('bigshake'),450) }
        this.float(dstWho,'-'+res.dmg, heavy?'#ff1744':'#ff5252', heavy)
        const p=center(petNode(dstWho))
        spawn('impact',`<svg viewBox="-100 -70 200 140"><polygon points="${spikes(14,78,42)}" fill="#fff" stroke="#111" stroke-width="6"/></svg>`,p.x,p.y,500)
      }
    },

    async reveal(c){ const w=document.createElement('div'); w.className='reveal'; w.innerHTML=''; sceneEl().appendChild(w)
      // mini-affichage de la carte révélée (texte seul, suffisant)
      w.innerHTML=`<div class="card t-${CARD(c).type}" style="position:relative"><div class="art">${CARD(c).art}</div><div class="name">${CARD(c).n}</div></div>`
      await sleep(pausedRef.current?1100:720); w.remove() },

    // FLASH façon Quicksilver : l'avatar court partout très vite
    async flash(isMe){
      SFX.flash&&SFX.flash()
      const scene=sceneEl(); scene.classList.add('slowmo')
      const base=center(poteNode(isMe?'me':'opp'))
      const spots=[[40,250],[300,120],[180,70],[60,120],[330,260],[200,200],[120,300],[300,300]]
      const runner=spawn('quicksilver','<img src="'+IMG.avatarKnee[(getG().me&&isMe)?getG().me.avatar:'h2']+'" style="width:70px">',base.x,base.y,0)
      const f=spawn('float huge','⚡ FLASH ! ⚡',base.x,base.y-60,1900); f.style.color='#ffeb3b'
      for(let i=0;i<spots.length;i++){
        const [x,y]=spots[i]
        spawn('ghost','<img src="'+IMG.avatarKnee[(getG().me&&isMe)?getG().me.avatar:'h2']+'" style="width:60px;opacity:.4">',runner.offsetLeft,runner.offsetTop,400)
        runner.style.left=x+'px'; runner.style.top=y+'px'
        SFX.whoosh&&SFX.whoosh()
        await sleep(150)
      }
      runner.animate([{opacity:1},{opacity:0}],{duration:200,fill:'forwards'})
      await sleep(250); runner.remove(); scene.classList.remove('slowmo')
    }
  }
  useImperativeHandle(ref, ()=>api)
  return <div ref={layer} style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:30}}/>
})
export default Fx
