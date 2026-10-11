import { useState, useEffect } from 'react'
import { ownedSet } from '../data/cards.js'
import { loadWallet } from './economy.js'

const LS='bdp_build_v5'
const load=()=>{ try{return JSON.parse(localStorage.getItem(LS))||null}catch{return null} }

// Etat de configuration partage par les ecrans Avatar / Familier / Deck.
export function useLoadout(){
  const [b,setB] = useState(()=> load() || { avatar:'h1', pet:'chien', top:'tshirt', bottom:'jean', deck:{} })
  useEffect(()=>{ localStorage.setItem(LS, JSON.stringify(b)) },[b])
  const [owned,setOwned] = useState(()=>ownedSet([]))
  useEffect(()=>{ (async()=>{ const w=await loadWallet(); setOwned(ownedSet(w?w.collection:[])) })() },[])
  const set=(patch)=> setB(prev=>({...prev,...patch}))
  return { b, setB, set, owned }
}
