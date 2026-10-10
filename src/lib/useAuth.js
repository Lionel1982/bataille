import { useEffect, useState, useCallback } from 'react'
import { supabase, online } from './supabase.js'

// Gere la session Supabase + le profil. Hors-ligne (pas de Supabase) -> mode invite.
export function useAuth(){
  const [session,setSession] = useState(null)
  const [profile,setProfile] = useState(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    if(!online){ setLoading(false); return }
    supabase.auth.getSession().then(({data})=>{ setSession(data.session); setLoading(false) })
    const { data:sub } = supabase.auth.onAuthStateChange((_e,s)=> setSession(s))
    return ()=> sub.subscription.unsubscribe()
  },[])

  useEffect(()=>{
    if(!online || !session){ setProfile(null); return }
    supabase.from('profiles').select('*').eq('id',session.user.id).single()
      .then(({data})=> setProfile(data))
  },[session])

  const signUp = useCallback(async (email,password,pseudo)=>{
    const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ pseudo } } })
    return error
  },[])
  const signIn = useCallback(async (email,password)=>{
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  },[])
  const signOut = useCallback(async ()=>{ await supabase.auth.signOut() },[])

  return { online, session, profile, loading, signUp, signIn, signOut }
}
