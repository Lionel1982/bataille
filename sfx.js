// ===== SONS (synthétisés, aucun fichier) =====
const SFX=(()=>{let ctx=null,on=true;
  const ac=()=>ctx||(ctx=new (window.AudioContext||window.webkitAudioContext)());
  function tone(f1,f2,dur,type='square',vol=.15,delay=0){if(!on)return;const c=ac(),t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur);}
  function noise(dur,vol=.2,freq=1200,delay=0,q=1){if(!on)return;const c=ac(),t=c.currentTime+delay,n=c.sampleRate*dur,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=freq;f.Q.value=q;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f).connect(g).connect(c.destination);s.start(t);}
  const S={
    card:()=>{noise(.08,.15,3000);tone(500,900,.07,'triangle',.08);},
    food:()=>{tone(400,800,.1,'triangle',.15);tone(600,1200,.12,'triangle',.12,.08);},
    soda:()=>{noise(.25,.15,5000,0,4);tone(300,1400,.2,'sine',.08,.05);},
    flash:()=>{for(let i=0;i<5;i++)tone(400+i*200,1600+i*200,.12,'sawtooth',.07,i*.07);},
    bite:()=>{noise(.06,.4,800);tone(200,80,.12,'square',.2,.03);},
    slash:()=>{noise(.15,.3,4000,0,2);noise(.12,.25,2500,.1,2);},
    gas:()=>{tone(90,50,.5,'sawtooth',.25);noise(.5,.15,300);},
    splash:()=>{noise(.3,.3,1500,0,.7);tone(800,200,.2,'sine',.1);},
    taunt:()=>{tone(300,600,.12,'square',.1);tone(600,300,.12,'square',.1,.13);tone(300,700,.15,'square',.1,.26);},
    dive:()=>{tone(1800,200,.35,'sine',.15);noise(.12,.3,600,.33);},
    heal:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,f,.18,'triangle',.1,i*.08));},
    hit:()=>{noise(.12,.35,500);tone(150,60,.15,'square',.2);},
    heavy:()=>{tone(120,30,.7,'sawtooth',.35);noise(.6,.5,200,0,.5);tone(60,25,.8,'sine',.4,.05);},
    nuke:()=>{tone(60,20,1.4,'sawtooth',.4);noise(1.4,.5,150,0,.4);noise(.6,.3,2000,.1);},
    dodge:()=>{noise(.2,.15,6000,0,3);tone(900,1600,.12,'sine',.06);},
    objection:()=>{tone(220,220,.08,'square',.12);tone(330,330,.18,'square',.12,.08);},
    poison:()=>{tone(300,150,.25,'sine',.12);},
    whoosh:()=>{noise(.18,.22,2200,0,2.5);tone(1200,300,.15,'sine',.05);},
    win:()=>{[523,659,784,1046,1318].forEach((f,i)=>tone(f,f,.25,'square',.1,i*.12));},
    lose:()=>{[392,330,262,196].forEach((f,i)=>tone(f,f*.97,.35,'triangle',.15,i*.2));},
    turn:()=>{tone(660,660,.07,'square',.08);tone(880,880,.1,'square',.08,.08);}
  };
  S.toggle=()=>(on=!on);S.isOn=()=>on;S.unlock=()=>{try{ac().resume();}catch(e){}};
  return S;})();
