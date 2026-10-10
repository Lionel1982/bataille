// ===== DONNÉES DU JEU v3 =====
const BUDGET=100, DECK_SIZE=30, HAND_DRAW=4, SODA_MAX=3, FOOD_CAP=8;

const FAMILIES={
  poils:{n:'Poils',i:'🐾',c:'#ffb74d'},
  ecailles:{n:'Écailles',i:'🦎',c:'#81c784'},
  aqua:{n:'Aqua',i:'💧',c:'#4fc3f7'},
  plumes:{n:'Plumes',i:'🪶',c:'#ce93d8'}
};
// Carac actives en v3 (légères)
const TRAITS={
  carapace:{n:'Carapace',d:'-25% dégâts subis'},
  minuscule:{n:'Minuscule',d:'Esquive +10%, frappe -25%'},
  enorme:{n:'Énorme',d:'Frappe +50%, inesquivable mais lent'}
};
// pow = multiplicateur de dégâts physiques (gabarit). size pour l'affichage.
const CREATURES={
  chat:{n:'Chat',f:'poils',hp:55,spd:4,pow:1,size:88,pts:16},
  chien:{n:'Chien',f:'poils',hp:70,spd:3,pow:1.15,size:96,pts:20},
  souris:{n:'Souris',f:'poils',hp:34,spd:6,pow:.75,size:58,pts:10,t:['minuscule']},
  elephant:{n:'Éléphant',f:'poils',hp:120,spd:1,pow:1.6,size:150,pts:42,t:['enorme']},
  bison:{n:'Bison',f:'poils',hp:100,spd:2,pow:1.45,size:135,pts:36,t:['enorme']},
  serpent:{n:'Serpent',f:'ecailles',hp:50,spd:4,pow:1,size:86,pts:16},
  lezard:{n:'Lézard',f:'ecailles',hp:48,spd:5,pow:1,size:84,pts:17},
  tortue:{n:'Tortue',f:'ecailles',hp:85,spd:1,pow:1,size:100,pts:24,t:['carapace']},
  poisson:{n:'Poisson',f:'aqua',hp:52,spd:3,pow:1,size:86,pts:14},
  guppy:{n:'Guppy',f:'aqua',hp:30,spd:6,pow:.75,size:54,pts:8,t:['minuscule']},
  oiseau:{n:'Oiseau',f:'plumes',hp:44,spd:5,pow:1,size:80,pts:16},
  poulet:{n:'Poulet',f:'plumes',hp:58,spd:3,pow:1,size:88,pts:13}
};
const TOPS={
  tshirt:{n:'T-shirt',i:'👕',pts:0,front:0,hp:0,d:'Rien'},
  chemisette:{n:'Chemisette',i:'🌺',pts:6,front:1,hp:0,d:'+1 poche avant (VISIBLE)'},
  lourd:{n:'T-shirt lourd',i:'🧥',pts:12,front:0,hp:20,d:'+20 PV'}
};
const BOTTOMS={
  short:{n:'Short',i:'🩳',pts:0,back:1,d:'1 poche arrière'},
  jean:{n:'Jean',i:'👖',pts:8,back:2,d:'2 poches arrière'},
  baggy:{n:'Baggy',i:'🧢',pts:20,back:4,d:'4 poches arrière'}
};
// fam = famille privilégiée : -1 coût et +50% d'effet si ton animal est de cette famille.
// big = finisher (anim spéciale)
const CARDS={
  croq:{n:'Croquettes',art:'🥣',type:'food',pts:0,txt:'+1 🍖 permanent (max 8). 1 nourriture/tour.'},
  festin:{n:'Gamelle pleine',art:'🍲',type:'food',pts:6,food:2,txt:'+2 🍖 permanents d\'un coup !'},
  soda:{n:'Soda',art:'🥤',type:'soda',pts:2,txt:'+1 jauge. 3/3 = FLASH : tu rejoues !'},
  // --- basiques
  morsure:{n:'Morsure',art:'🦷',type:'spell',cost:2,pts:2,target:'pet',dmg:10,phys:1,anim:'bite',fx:'CHOMP !',col:'#ff5252',txt:'10 dégâts physiques.'},
  pue:{n:'Pet qui pue',art:'💨',type:'spell',cost:2,pts:3,target:'pet',dmg:3,poison:3,anim:'gas',fx:'PROUT !',col:'#9be564',txt:'3 dégâts + poison 4/tour pendant 3 tours.'},
  pique:{n:'Pet qui pique les yeux',art:'😵',type:'spell',cost:2,pts:4,target:'pote',eyes:2,anim:'gas',fx:'ÇA PIQUE !',col:'#ffa94d',txt:'Sorts adverses +1 coût pendant 2 tours.'},
  bave:{n:'Jet de bave',art:'💦',type:'spell',cost:1,pts:2,target:'pet',slow:3,anim:'splash',fx:'SPLOTCH !',col:'#7fd8ff',txt:'0 dégât. Vitesse adverse -1 pendant 3 tours.'},
  sable:{n:'Jet de sable',art:'🏖️',type:'spell',cost:1,pts:2,target:'pet',blind:1,anim:'splash',fx:'AVEUGLÉ !',col:'#ffe082',txt:'Sa prochaine attaque : 60% de rater.'},
  grimace:{n:'Grimace',art:'🤪',type:'spell',cost:1,pts:2,target:'pote',fear:2,anim:'taunt',fx:'BOUH !',col:'#ff8af5',txt:'Dégâts adverses /2 pendant 2 tours.'},
  vabosser:{n:'Va bosser !',art:'💼',type:'spell',cost:2,pts:4,target:'pote',work:1,anim:'taunt',fx:'AU BOULOT !',col:'#90a4ae',txt:'L\'adversaire pioche 2 cartes de moins.'},
  poche:{n:'Poche trouée',art:'🕳️',type:'spell',cost:1,pts:2,target:'pote',hole:1,anim:'taunt',fx:'OUPS !',col:'#b39ddb',txt:'Défausse 1 carte de sa poche.'},
  calin:{n:'Gros câlin',art:'🤗',type:'spell',cost:2,pts:3,target:'self',heal:14,anim:'heal',fx:'CÂLIN !',col:'#ffb3d9',txt:'Soigne 14 PV.'},
  // --- par famille (privilégiée)
  griffe:{n:'Coup de griffe',art:'🐾',type:'spell',cost:2,pts:4,fam:'poils',target:'pet',dmg:12,phys:1,anim:'slash',fx:'SCRATCH !',col:'#ff7043',txt:'12 dégâts. POILS : -1 coût, +50%.'},
  venin:{n:'Crochets venimeux',art:'🐍',type:'spell',cost:3,pts:5,fam:'ecailles',target:'pet',dmg:6,poison:4,anim:'bite',fx:'SSSSS !',col:'#66bb6a',txt:'6 dégâts + poison 4 tours. ÉCAILLES : -1 coût, +50%.'},
  mue:{n:'Mue',art:'🧬',type:'spell',cost:2,pts:4,fam:'ecailles',target:'self',heal:10,cleanse:1,anim:'heal',fx:'MUE !',col:'#aed581',txt:'Soigne 10 et retire tous les malus.'},
  tsunami:{n:'Vague scélérate',art:'🌊',type:'spell',cost:3,pts:5,fam:'aqua',target:'pet',dmg:9,slow:2,anim:'splash',fx:'GLOUGLOU !',col:'#29b6f6',txt:'9 dégâts + ralentit. AQUA : -1 coût, +50%.'},
  bulle:{n:'Bulle protectrice',art:'🫧',type:'spell',cost:2,pts:4,fam:'aqua',target:'self',shield:12,anim:'heal',fx:'BLOP !',col:'#80deea',txt:'Bouclier qui absorbe 12 dégâts.'},
  fiente:{n:'Fiente en piqué',art:'💩',type:'spell',cost:2,pts:4,fam:'plumes',target:'pet',dmg:8,blind:1,anim:'dive',fx:'SPLAF !',col:'#a1887f',txt:'8 dégâts + aveugle. PLUMES : -1 coût, +50%.'},
  plumage:{n:'Envol',art:'🪶',type:'spell',cost:1,pts:3,fam:'plumes',target:'self',haste:2,anim:'heal',fx:'ZOOOM !',col:'#ce93d8',txt:'+2 vitesse pendant 2 tours.'},
  // --- lourdes / finishers (à garder en poche !)
  charge:{n:'Charge écrasante',art:'💥',type:'spell',cost:5,pts:8,target:'pet',dmg:22,phys:1,big:1,anim:'charge',fx:'BAOUM !!',col:'#d50000',txt:'22 dégâts physiques. Les gros animaux font un carnage.'},
  sumo:{n:'Plongeon sumo',art:'🏋️',type:'spell',cost:6,pts:10,target:'pet',dmg:20,phys:1,stun:1,big:1,anim:'charge',fx:'CRAAAC !!',col:'#6a1b9a',txt:'20 dégâts physiques + l\'adversaire saute son tour.'},
  nuclear:{n:'Prout nucléaire',art:'☢️',type:'spell',cost:7,pts:12,target:'pet',dmg:18,poison:4,big:1,anim:'nuke',fx:'KA-BOUM !!!',col:'#76ff03',txt:'18 dégâts + poison 4 tours. Le quartier évacue.'},
  apero:{n:'L\'apéro des potes',art:'🍻',type:'spell',cost:5,pts:9,target:'self',heal:30,draw:2,big:1,anim:'heal',fx:'SANTÉ !!',col:'#ffca28',txt:'Soigne 30 PV et pioche 2 cartes.'}
};
const DEFAULT_DECK={croq:10,festin:1,soda:3,morsure:3,pue:2,bave:2,sable:1,grimace:2,calin:1,griffe:2,pique:1,vabosser:1,charge:1};
