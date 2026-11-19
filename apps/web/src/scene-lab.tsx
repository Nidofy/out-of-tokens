import {useEffect,useRef,useState} from 'preact/hooks';
import {createInitialState,getViewModel} from 'oot-core';
import type {Scene} from 'oot-core';
import type {CapacityExplanation} from 'oot-platform';
import {content} from './content.js';
import {actorIds} from './studio-ui.js';
import {createWorkshop} from './scene.js';

type BluewhaleDemoMode='daily'|'work'|'review'|'overload'|'blocked'|'rest';

// DEV-only visual fixture; never uses useGame, storage or actual player state.
export function SceneLab(){
 const host=useRef<HTMLDivElement>(null),renderer=useRef<Awaited<ReturnType<typeof createWorkshop>>|null>(null);
 const [scene,setScene]=useState<Scene>('workshop'),[level,setLevel]=useState(0),[picked,setPicked]=useState(''),[ready,setReady]=useState(false);
 const [demoMode,setDemoMode]=useState<BluewhaleDemoMode>('daily'),[legacyFallback,setLegacyFallback]=useState(false),[stillDemo,setStillDemo]=useState(false);

 useEffect(()=>{
  document.documentElement.dataset.motion=stillDemo?'still':'full';
 },[stillDemo]);

 useEffect(()=>{
  document.documentElement.dataset.chibi=legacyFallback?'legacy':'';
  document.documentElement.dataset.motion=stillDemo?'still':'full';
  let dead=false;
  setReady(false);
  void createWorkshop(host.current!,setPicked).then(r=>{
   if(dead)r.destroy();
   else{renderer.current=r;setReady(true);}
  });
  return()=>{dead=true;renderer.current?.destroy();renderer.current=null;};
 },[legacyFallback]);

 useEffect(()=>{
  if(!ready||!renderer.current)return;
  const c={...content,campaign:{...content.campaign!,initial:actorIds,recruits:[]}},s=createInitialState(c,1);
  s.campaign!.scene=scene;s.campaign!.hardware.office=level;s.campaign!.hardware.compute=level;
  for(const r of Object.values(s.campaign!.relations)){r.location=scene;r.locationUntil=1000;}
  const office=s.campaign!.office;
  if(office&&!office.items.some(i=>i.kind==='sofa')){
   office.items.push({id:'f99',kind:'sofa',slot:'lounge-2'});
  }
  const bw=s.actors.find(a=>a.id==='bluewhale');
  let cap:Readonly<Record<string,CapacityExplanation>>|undefined;
  let vm=getViewModel(s,c);
  if(scene==='workshop'){
   if(demoMode==='work'||demoMode==='overload'||demoMode==='blocked'){
    const job=s.jobs[0]!;
    job.status='working';
    job.team=[{character:'bluewhale',role:'worker',mode:'local'},{character:'qwen',role:'reviewer',mode:'cloud'}];
    if(office){
     office.reservations.bluewhale={item:'f1',seat:0,job:job.id,zone:'work'};
     office.reservations.qwen={item:'f4',seat:0,job:job.id,zone:'meeting'};
    }
    if(demoMode==='overload'){
     if(bw)bw.mood=42;
     cap={bluewhale:{actorId:'bluewhale',activeJobCount:2,activeLoad:2,overloaded:true,activeEfficiency:0.15,activeEnergyCost:22,station:'basic',workRole:'worker',effectiveLoad:2,loadPenalty:0.25,projectedLoad:2,projectedOverloaded:true,energy:42,lowEnergy:false,energyPenalty:0,mood:42,moodFactor:1,effectiveOutputFactor:0.75} as unknown as CapacityExplanation};
    }
    if(demoMode==='blocked'){
     if(bw)bw.energy=32;
    }
    vm=getViewModel(s,c);
    if(demoMode==='blocked'){
     vm={...vm,possibleStops:['bluewhale']};
    }
   }else if(demoMode==='review'){
    const job=s.jobs[0]!;
    job.status='working';
    job.team=[{character:'bluewhale',role:'reviewer',mode:'cloud'},{character:'qwen',role:'worker',mode:'local'}];
    if(office){
     office.reservations.bluewhale={item:'f4',seat:0,job:job.id,zone:'meeting'};
     office.reservations.qwen={item:'f1',seat:0,job:job.id,zone:'work'};
    }
    vm=getViewModel(s,c);
   }else if(demoMode==='rest'){
    s.absoluteSlot=3;
    if(bw)bw.energy=28;
    vm=getViewModel(s,c);
   }
  }else{
   for(const a of s.actors)a.busyUntil=1;
   vm=getViewModel(s,c);
  }
  renderer.current.update(vm,'zh',null,'overview',undefined,undefined,false,cap);
 },[ready,scene,level,demoMode]);

 return (
  <div class="studio-app">
   <div class="workshop" ref={host}/>
   <div style="position:absolute;top:10px;left:10px;right:10px;background:#fff5df;padding:12px;color:#493a30;z-index:20;border-radius:10px">
    <b>DEV FIXTURE · 12 actors · no player save</b>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
     {(['workshop','canteen','library'] as const).map(id=><button key={id} onClick={()=>setScene(id)}>{id}</button>)}
     {[0,1,3].map(n=><button key={n} onClick={()=>setLevel(n)}>Office {n}</button>)}
     <span>| Bluewhale:</span>
     {(['daily','work','review','overload','blocked','rest'] as const).map(m=><button key={m} style={demoMode===m?'font-weight:700;text-decoration:underline':''} onClick={()=>setDemoMode(m)}>{m}</button>)}
     <button onClick={()=>setLegacyFallback(v=>!v)}>{legacyFallback?'Rig: Legacy PaperDoll':'Rig: MapleChibi'}</button>
     <button onClick={()=>setStillDemo(v=>!v)}>{stillDemo?'Motion: Still':'Motion: Full'}</button>
    </div>
    <p style="margin:6px 0 0">Selected: {picked||'none'} · {scene} · Office {level} · Bluewhale: {demoMode} · {legacyFallback?'legacy':'maple-chibi'}</p>
   </div>
  </div>
 );
}
