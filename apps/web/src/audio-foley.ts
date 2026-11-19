export interface AudioPrefs {
 sfx:boolean;
 ambience:boolean;
}

const SFX_KEY='oot-audio-sfx';
const AMB_KEY='oot-audio-ambience';

type VoiceSpec={base:number;interval:number;wave:OscillatorType;dur:number;stepMs:number};

const voiceprints:Readonly<Record<string,VoiceSpec>>={
 bluewhale:{base:370,interval:1.25,wave:'triangle',dur:0.068,stepMs:76},
 qwen:{base:415,interval:1.2,wave:'triangle',dur:0.06,stepMs:68},
 llama:{base:330,interval:1.25,wave:'sine',dur:0.075,stepMs:85},
 mistral:{base:587,interval:1.5,wave:'sine',dur:0.048,stepMs:54},
 gpt:{base:494,interval:1.33,wave:'sine',dur:0.06,stepMs:66},
 claude:{base:294,interval:1.19,wave:'triangle',dur:0.07,stepMs:80},
 kimi:{base:311,interval:1.25,wave:'sine',dur:0.072,stepMs:78},
 gemini:{base:523,interval:1.41,wave:'sine',dur:0.062,stepMs:64},
 grok:{base:554,interval:1.49,wave:'triangle',dur:0.05,stepMs:56},
 glm:{base:277,interval:1.2,wave:'sine',dur:0.074,stepMs:84},
 minimax:{base:440,interval:1.26,wave:'sine',dur:0.065,stepMs:70},
 seedance:{base:622,interval:1.33,wave:'triangle',dur:0.052,stepMs:58}
};

let ctx:AudioContext|null=null;
let flipCtx:AudioContext|null=null;
let flipBuf:AudioBuffer|null=null;
let ambGain:GainNode|null=null;
let ambStop:(()=>void)|null=null;
let ambKey='';

function audioSuppressed():boolean{
 if(typeof window==='undefined'||typeof document==='undefined')return true;
 return document.documentElement.dataset.motion==='still'||matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getContext():AudioContext|null{
 if(typeof window==='undefined')return null;
 const Ctor=(window as Window&{AudioContext?:typeof AudioContext;webkitAudioContext?:typeof AudioContext}).AudioContext
  ??(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
 if(!Ctor)return null;
 if(!ctx)try{ctx=new Ctor();}catch{return null;}
 if(ctx.state==='suspended')void ctx.resume().catch(()=>{});
 return ctx;
}

export function readAudioPrefs():AudioPrefs{
 try{
  const sfx=localStorage.getItem(SFX_KEY)!=='off';
  const ambience=localStorage.getItem(AMB_KEY)==='on';
  return {sfx,ambience};
 }catch{
  return {sfx:true,ambience:false};
 }
}

export function writeAudioPrefs(next:AudioPrefs):void{
 try{
  localStorage.setItem(SFX_KEY,next.sfx?'on':'off');
  localStorage.setItem(AMB_KEY,next.ambience?'on':'off');
 }catch{
  // Private/disabled storage never blocks play.
 }
}

export function unlockAudio():void{
 if(audioSuppressed())return;
 getContext();
}

export function playFoley(kind:'flip'|'tap'|'stamp'|'coin'|'message'|'advance',enabled=true):void{
 if(!enabled||audioSuppressed())return;
 const ac=getContext();
 if(!ac||ac.state!=='running')return;
 const now=ac.currentTime;
 try{
  if(kind==='flip'){
   if(flipCtx!==ac||!flipBuf){
    const len=Math.floor(ac.sampleRate*0.065);
    const buf=ac.createBuffer(1,len,ac.sampleRate);
    const ch=buf.getChannelData(0);
    for(let i=0;i<len;i++)ch[i]=(Math.random()*2-1)*Math.sin((i/len)*Math.PI);
    flipCtx=ac;flipBuf=buf;
   }
   const src=ac.createBufferSource();
   src.buffer=flipBuf;
   const filter=ac.createBiquadFilter();
   filter.type='bandpass';filter.frequency.value=1250;filter.Q.value=1.4;
   const gain=ac.createGain();
   gain.gain.setValueAtTime(0.032,now);
   gain.gain.exponentialRampToValueAtTime(0.001,now+0.065);
   src.connect(filter);filter.connect(gain);gain.connect(ac.destination);
   src.start(now);
   return;
  }
  const tones=kind==='coin'?[587.33,880]:kind==='stamp'?[146.83,220]:kind==='message'?[440,587.33]:kind==='advance'?[392,493.88]:[460];
  tones.forEach((freq,i)=>{
   const osc=ac.createOscillator(),gain=ac.createGain();
   osc.type=kind==='stamp'?'triangle':'sine';
   const t=now+i*0.055;
   osc.frequency.setValueAtTime(freq,t);
   gain.gain.setValueAtTime(0.001,t);
   gain.gain.linearRampToValueAtTime(kind==='stamp'?0.05:0.034,t+0.008);
   gain.gain.exponentialRampToValueAtTime(0.0008,t+(kind==='stamp'?0.09:0.075));
   osc.connect(gain);gain.connect(ac.destination);
   osc.start(t);osc.stop(t+0.11);
  });
 }catch{
  // Audio node errors never break interaction.
 }
}

export function playVoiceBlip(actorId:string,syllables=2,enabled=true):void{
 if(!enabled||audioSuppressed())return;
 const ac=getContext();
 if(!ac||ac.state!=='running')return;
 const spec=voiceprints[actorId]??voiceprints.qwen!;
 const now=ac.currentTime;
 const count=Math.max(1,Math.min(4,syllables));
 try{
  for(let i=0;i<count;i++){
   const osc=ac.createOscillator(),gain=ac.createGain();
   const t=now+i*(spec.stepMs/1000);
   const ratio=i%2===1?spec.interval:i===2?1.08:1;
   osc.type=spec.wave;
   osc.frequency.setValueAtTime(spec.base*ratio,t);
   gain.gain.setValueAtTime(0.001,t);
   gain.gain.linearRampToValueAtTime(0.028,t+0.008);
   gain.gain.exponentialRampToValueAtTime(0.0008,t+spec.dur);
   osc.connect(gain);gain.connect(ac.destination);
   osc.start(t);osc.stop(t+spec.dur+0.02);
  }
 }catch{
  // Safe no-op in headless/restricted environments.
 }
}

export function syncAmbience(scene:string,night:boolean,enabled:boolean):void{
 const nextKey=enabled&&!audioSuppressed()?`${scene}:${night?'night':'day'}`:'off';
 if(nextKey===ambKey)return;
 ambStop?.();ambStop=null;ambKey=nextKey;
 if(nextKey==='off')return;
 const ac=getContext();
 if(!ac)return;
 try{
  const len=ac.sampleRate*2;
  const buf=ac.createBuffer(1,len,ac.sampleRate);
  const ch=buf.getChannelData(0);
  let last=0;
  for(let i=0;i<len;i++){
   const white=Math.random()*2-1;
   last=(last+0.04*white)/1.04;
   ch[i]=last*1.8;
  }
  const src=ac.createBufferSource();
  src.buffer=buf;src.loop=true;
  const filter=ac.createBiquadFilter();
  filter.type='lowpass';
  filter.frequency.value=scene==='canteen'?(night?420:540):scene==='library'?280:(night?340:440);
  const gain=ac.createGain();
  gain.gain.value=scene==='library'?0.014:0.02;
  src.connect(filter);filter.connect(gain);gain.connect(ac.destination);
  src.start();
  ambGain=gain;
  ambStop=()=>{try{ambGain?.disconnect();src.stop();src.disconnect();}catch{/* already stopped */}};
 }catch{
  ambKey='off';
 }
}
