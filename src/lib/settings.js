// Reglages locaux (debug / confort), persistes dans le navigateur.
const LS='bdp_settings'
const read=()=>{ try{return JSON.parse(localStorage.getItem(LS))||{}}catch{return {}} }
let S = Object.assign({ allowIncomplete:false, debugLogs:true }, read())
export function getSetting(k){ return S[k] }
export function setSetting(k,v){ S={...S,[k]:v}; localStorage.setItem(LS,JSON.stringify(S)); return S }
export function allSettings(){ return {...S} }
