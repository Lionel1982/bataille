// ===== DONNÉES DU JEU v4 =====
const BUDGET=120, DECK_SIZE=30, HAND_DRAW=4, SODA_MAX=3, FOOD_CAP=10;

const FAMILIES={
  poils:{n:'Poils',i:'🐾',c:'#ffb74d'},
  ecailles:{n:'Écailles',i:'🦎',c:'#81c784'},
  aqua:{n:'Aqua',i:'💧',c:'#4fc3f7'},
  plumes:{n:'Plumes',i:'🪶',c:'#ce93d8'}
};
// 2 types de nourriture par famille. "fam" = la famille qui en profite (coût réduit + effet boosté).
const FOODS={
  croq:{n:'Croquettes',art:'🥣',fam:'poils'},
  os:{n:'Gros os',art:'🦴',fam:'poils'},
  grillon:{n:'Grillons',art:'🦗',fam:'ecailles'},
  salade:{n:'Salade',art:'🥬',fam:'ecailles'},
  vers:{n:'Vers',art:'🪱',fam:'aqua'},
  algue:{n:'Algues',art:'🌿',fam:'aqua'},
  graine:{n:'Graines',art:'🌰',fam:'plumes'},
  asticot:{n:'Asticots',art:'🐛',fam:'plumes'}
};
// Caractéristiques actives
const TRAITS={
  carapace:{n:'Carapace',d:'-30% dégâts subis'},
  minuscule:{n:'Minuscule',d:'Esquive +12%, frappe -25%'},
  enorme:{n:'Énorme',d:'Frappe +60%, inesquivable, mais lent'}
};
// pow = multiplicateur dégâts physiques. size = taille à l'écran.
const CREATURES={
  chat:{n:'Chat',f:'poils',hp:52,spd:4,pow:1,size:92,pts:18},
  chien:{n:'Chien',f:'poils',hp:72,spd:3,pow:1.2,size:104,pts:24},
  souris:{n:'Souris',f:'poils',hp:30,spd:6,pow:.7,size:60,pts:12,t:['minuscule']},
  elephant:{n:'Éléphant',f:'poils',hp:130,spd:1,pow:1.7,size:155,pts:48,t:['enorme']},
  bison:{n:'Bison',f:'poils',hp:108,spd:2,pow:1.5,size:140,pts:40,t:['enorme']},
  serpent:{n:'Serpent',f:'ecailles',hp:46,spd:5,pow:1,size:88,pts:20},
  lezard:{n:'Lézard',f:'ecailles',hp:46,spd:5,pow:1.05,size:86,pts:20},
  tortue:{n:'Tortue',f:'ecailles',hp:92,spd:1,pow:1,size:104,pts:28,t:['carapace']},
  poisson:{n:'Poisson',f:'aqua',hp:54,spd:3,pow:1,size:88,pts:16},
  guppy:{n:'Guppy',f:'aqua',hp:26,spd:6,pow:.7,size:56,pts:9,t:['minuscule']},
  oiseau:{n:'Oiseau',f:'plumes',hp:42,spd:6,pow:.95,size:82,pts:19},
  poulet:{n:'Poulet',f:'plumes',hp:60,spd:3,pow:1,size:92,pts:15}
};
const TOPS={
  tshirt:{n:'T-shirt',i:'👕',pts:0,front:0,hp:0,d:'Rien'},
  chemisette:{n:'Chemisette',i:'🌺',pts:8,front:1,hp:0,d:'+1 poche avant (VISIBLE)'},
  lourd:{n:'T-shirt lourd',i:'🧥',pts:16,front:0,hp:24,d:'+24 PV'}
};
const BOTTOMS={
  short:{n:'Short',i:'🩳',pts:0,back:1,d:'1 poche arrière'},
  jean:{n:'Jean',i:'👖',pts:10,back:2,d:'2 poches arrière'},
  baggy:{n:'Baggy',i:'🧢',pts:26,back:4,d:'4 poches arrière'}
};
const AVATARS={
  h1:{n:'Max',g:'h'},h2:{n:'Theo',g:'h'},h3:{n:'Hugo',g:'h'},
  f1:{n:'Lea',g:'f'},f2:{n:'Zoe',g:'f'},f3:{n:'Jade',g:'f'}
};
// CARTES. food:<key> = carte nourriture. type spell: target pet/pote/self.
// foodType = quelle famille de nourriture le sort "préfère" (coût -1, effet +50% si l'animal est de cette famille).
const CARDS={
  // --- Nourriture (2 par famille) ---
  croq:{n:'Croquettes',art:'🥣',type:'food',food:'croq',pts:0,txt:'+1 🍖 Croquettes (Poils).'},
  os:{n:'Gros os',art:'🦴',type:'food',food:'os',pts:1,gain:2,txt:'+2 🍖 Os (Poils) d\'un coup.'},
  grillon:{n:'Grillons',art:'🦗',type:'food',food:'grillon',pts:0,txt:'+1 🍖 Grillons (Écailles).'},
  salade:{n:'Salade',art:'🥬',type:'food',food:'salade',pts:1,gain:2,txt:'+2 🍖 Salade (Écailles).'},
  vers:{n:'Vers',art:'🪱',type:'food',food:'vers',pts:0,txt:'+1 🍖 Vers (Aqua).'},
  algue:{n:'Algues',art:'🌿',type:'food',food:'algue',pts:1,gain:2,txt:'+2 🍖 Algues (Aqua).'},
  graine:{n:'Graines',art:'🌰',type:'food',food:'graine',pts:0,txt:'+1 🍖 Graines (Plumes).'},
  asticot:{n:'Asticots',art:'🐛',type:'food',food:'asticot',pts:1,gain:2,txt:'+2 🍖 Asticots (Plumes).'},
  soda:{n:'Soda',art:'🥤',type:'soda',pts:3,txt:'+1 jauge. 3/3 = FLASH : tu rejoues !'},
  // --- Sorts communs ---
  morsure:{n:'Morsure',art:'🦷',type:'spell',cost:2,pts:4,target:'pet',dmg:11,phys:1,anim:'slide',fx:'CHOMP !',col:'#ff5252',txt:'11 dégâts physiques.'},
  pue:{n:'Pet qui pue',art:'💨',type:'spell',cost:3,pts:6,target:'pet',dmg:4,poison:3,anim:'gas',fx:'PROUT !',col:'#9be564',txt:'4 dégâts + poison (5/tour, 3 tours).'},
  pique:{n:'Pique les yeux',art:'😵',type:'spell',cost:2,pts:5,target:'pote',eyes:2,anim:'gas',fx:'ÇA PIQUE !',col:'#ffa94d',txt:'Sorts adverses +1 coût pendant 2 tours.'},
  bave:{n:'Jet de bave',art:'💦',type:'spell',cost:2,pts:4,target:'pet',slow:3,anim:'splash',fx:'SPLOTCH !',col:'#7fd8ff',txt:'0 dégât, vitesse adverse -1 pendant 3 tours.'},
  sable:{n:'Jet de sable',art:'🏖️',type:'spell',cost:2,pts:4,target:'pet',blind:1,anim:'splash',fx:'AVEUGLÉ !',col:'#ffe082',txt:'Sa prochaine attaque a 60% de rater.'},
  grimace:{n:'Grimace',art:'🤪',type:'spell',cost:2,pts:4,target:'pote',fear:2,anim:'taunt',fx:'BOUH !',col:'#ff8af5',txt:'Dégâts adverses /2 pendant 2 tours.'},
  vabosser:{n:'Va bosser !',art:'💼',type:'spell',cost:3,pts:6,target:'pote',work:1,anim:'taunt',fx:'AU BOULOT !',col:'#90a4ae',txt:'L\'adversaire pioche 2 cartes de moins.'},
  poche:{n:'Poche trouée',art:'🕳️',type:'spell',cost:2,pts:4,target:'pote',hole:1,anim:'taunt',fx:'OUPS !',col:'#b39ddb',txt:'Défausse 1 carte de la poche adverse.'},
  calin:{n:'Gros câlin',art:'🤗',type:'spell',cost:3,pts:5,target:'self',heal:16,anim:'heal',fx:'CÂLIN !',col:'#ffb3d9',txt:'Soigne 16 PV.'},
  // --- Sorts de famille (foodType) ---
  griffe:{n:'Coup de griffe',art:'🐾',type:'spell',cost:3,pts:7,foodType:'poils',target:'pet',dmg:14,phys:1,anim:'slide',fx:'SCRATCH !',col:'#ff7043',txt:'14 dégâts. 🐾 Nourriture Poils : -1 coût, +50%.'},
  venin:{n:'Crochets venimeux',art:'🐍',type:'spell',cost:3,pts:7,foodType:'ecailles',target:'pet',dmg:7,poison:4,anim:'slide',fx:'SSSSS !',col:'#66bb6a',txt:'7 dégâts + poison 4 tours. 🦎 Écailles : -1, +50%.'},
  mue:{n:'Mue',art:'🧬',type:'spell',cost:3,pts:6,foodType:'ecailles',target:'self',heal:12,cleanse:1,anim:'heal',fx:'MUE !',col:'#aed581',txt:'Soigne 12 et retire les malus. 🦎 Écailles : -1, +50%.'},
  tsunami:{n:'Vague scélérate',art:'🌊',type:'spell',cost:4,pts:8,foodType:'aqua',target:'pet',dmg:11,slow:2,anim:'slide',fx:'GLOUGLOU !',col:'#29b6f6',txt:'11 dégâts + ralentit. 💧 Aqua : -1, +50%.'},
  bulle:{n:'Bulle protectrice',art:'🫧',type:'spell',cost:3,pts:6,foodType:'aqua',target:'self',shield:16,anim:'heal',fx:'BLOP !',col:'#80deea',txt:'Bouclier absorbant 16 dégâts. 💧 Aqua : -1, +50%.'},
  fiente:{n:'Fiente en piqué',art:'💩',type:'spell',cost:3,pts:7,foodType:'plumes',target:'pet',dmg:10,blind:1,anim:'dive',fx:'SPLAF !',col:'#a1887f',txt:'10 dégâts + aveugle. 🪶 Plumes : -1, +50%.'},
  envol:{n:'Envol',art:'🪶',type:'spell',cost:2,pts:5,foodType:'plumes',target:'self',haste:2,anim:'heal',fx:'ZOOOM !',col:'#ce93d8',txt:'+2 vitesse pendant 2 tours. 🪶 Plumes : -1, +50%.'},
  // --- Finishers (chers, à garder en poche) ---
  charge:{n:'Charge écrasante',art:'💥',type:'spell',cost:6,pts:11,target:'pet',dmg:24,phys:1,big:1,anim:'slide',fx:'BAOUM !!',col:'#d50000',txt:'24 dégâts physiques. Les gros animaux font un carnage.'},
  sumo:{n:'Plongeon sumo',art:'🏋️',type:'spell',cost:7,pts:13,target:'pet',dmg:22,phys:1,stun:1,big:1,anim:'slide',fx:'CRAAAC !!',col:'#6a1b9a',txt:'22 dégâts physiques + l\'adversaire saute son tour.'},
  nuclear:{n:'Prout nucléaire',art:'☢️',type:'spell',cost:8,pts:15,target:'pet',dmg:20,poison:4,big:1,anim:'nuke',fx:'KA-BOUM !!!',col:'#76ff03',txt:'20 dégâts + poison 4 tours. Le quartier évacue.'},
  apero:{n:'L\'apéro des potes',art:'🍻',type:'spell',cost:6,pts:12,target:'self',heal:34,draw:2,big:1,anim:'heal',fx:'SANTÉ !!',col:'#ffca28',txt:'Soigne 34 PV et pioche 2 cartes.'}
};
// Deck conseillé (bouton) — adapté à la famille de l'animal choisi
function suggestedDeck(fam){
  const base={soda:3,morsure:4,pue:2,bave:2,sable:1,grimace:2,calin:2,pique:1,vabosser:1,charge:1,sumo:1};
  const perFam={
    poils:{croq:5,os:2,griffe:3},
    ecailles:{grillon:5,salade:2,venin:2,mue:1},
    aqua:{vers:5,algue:2,tsunami:2,bulle:1},
    plumes:{graine:5,asticot:2,fiente:2,envol:1}
  };
  const d=Object.assign({},base,perFam[fam]);
  let n=Object.values(d).reduce((a,b)=>a+b,0);
  while(n<DECK_SIZE){d.croq=(d.croq||0)+1;n++;}       // compléter
  while(n>DECK_SIZE){d.soda--;n--;}
  return d;
}
