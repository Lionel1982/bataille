import { useState, useEffect } from 'react'
import { TOPS, BOTTOMS } from '../data/cards.js'
import { CHARACTERS, FALLBACK_AVATARS } from '../data/characters.js'
import { IMG } from '../assets/images.js'
import { loadManifest, charViewUrl, skinsForCharacter, skinSlugForCharacter, setCharacterSkin } from '../lib/skins.js'

// Ecran : choix du PERSONNAGE (affiche via sa vue 'select') + fringues.
// On peut aussi changer le SKIN d'un personnage (defaut reassignable).
export default function AvatarScreen({ ld, onBack }){
  const { b, set } = ld
  const [,force] = useState(0)
  useEffect(()=>{ loadManifest().then(()=>force(x=>x+1)) },[])

  // Portrait d'un personnage : vue 'select' de son skin, sinon image integree, sinon emoji.
  function portrait(id){
    const su = charViewUrl(id,'select')
    if(su) return <img src={su} alt=""/>
    if(IMG.avatarFull[id]) return <img src={IMG.avatarFull[id]} alt=""/>
    return <div className="avemoji">🧑</div>
  }

  const chars = Object.keys(CHARACTERS)        // persos a part entiere (Akhenat, Alex)
  const gens  = Object.keys(FALLBACK_AVATARS)  // repli generiques (Max..Jade)
  const curSkins = (b.avatar && CHARACTERS[b.avatar]) ? skinsForCharacter(b.avatar) : []

  return (
    <div className="screen2">
      <div className="backbar"><button onClick={onBack}>◀ Retour</button><span className="sp"/><b>👤 Mon personnage</b></div>
      <div className="s2body">
        <p className="hint">Choisis ton personnage. Chacun aura bientot ses propres stats.</p>
        <div className="avgrid">
          {chars.map(id=>(
            <div key={id} className={'avbig'+(b.avatar===id?' sel':'')} onClick={()=>set({avatar:id})}>
              {portrait(id)}<b>{CHARACTERS[id].n}</b>
            </div>
          ))}
        </div>

        {/* Changer le skin du personnage selectionne (si plusieurs dispos) */}
        {b.avatar && CHARACTERS[b.avatar] && curSkins.length>1 && <>
          <h2 className="s2h2">Skin de {CHARACTERS[b.avatar].n}</h2>
          <div className="opts">
            {curSkins.map(s=>(
              <div key={s.slug} className={'opt'+(skinSlugForCharacter(b.avatar)===s.slug?' sel':'')}
                   onClick={()=>{ setCharacterSkin(b.avatar, s.slug); force(x=>x+1) }}>
                <img className="skinthumb" src={'/skins/'+s.slug+'/select.png'} alt=""/>
                <b>{s.name||s.slug}</b>
              </div>
            ))}
          </div>
        </>}

        <h2 className="s2h2">Personnages génériques</h2>
        <p className="hint">En attendant leurs planches, ils gardent leur image d'origine.</p>
        <div className="avgrid">
          {gens.map(id=>(
            <div key={id} className={'avbig'+(b.avatar===id?' sel':'')} onClick={()=>set({avatar:id})}>
              {portrait(id)}<b>{FALLBACK_AVATARS[id].n}</b>
            </div>
          ))}
        </div>

        <h2 className="s2h2">Tes fringues</h2>
        <p className="hint">Elles donnent des poches (stockage de cartes) et parfois des PV.</p>
        <div className="opts">{Object.entries(TOPS).map(([k,o])=>(<div key={k} className={'opt'+(b.top===k?' sel':'')} onClick={()=>set({top:k})}><div className="e">{o.i}</div><b>{o.n}·{o.pts}💰</b>{o.d}</div>))}</div>
        <div className="opts">{Object.entries(BOTTOMS).map(([k,o])=>(<div key={k} className={'opt'+(b.bottom===k?' sel':'')} onClick={()=>set({bottom:k})}><div className="e">{o.i}</div><b>{o.n}·{o.pts}💰</b>{o.d}</div>))}</div>
      </div>
      <div className="s2foot"><button className="big" onClick={onBack}>✓ VALIDER</button></div>
    </div>
  )
}
