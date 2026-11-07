import {useEffect,useRef,useState} from 'preact/hooks';
import {createInitialState,getViewModel} from 'oot-core';
import type {Scene} from 'oot-core';
import {content} from './content.js';
import {actorIds} from './studio-ui.js';
import {createWorkshop} from './scene.js';
// DEV-only visual fixture; never uses useGame, storage or actual player state.
export function SceneLab(){
 const host=useRef<HTMLDivElement>(null),renderer=useRef<Awaited<ReturnType<typeof createWorkshop>>|null>(null);
 const [scene,setScene]=useState<Scene>('workshop'),[level,setLevel]=useState(0),[picked,setPicked]=useState(''),[ready,setReady]=useState(false);
 useEffect(()=>{let dead=false;void createWorkshop(host.current!,setPicked).then(r=>{if(dead)r.destroy();else{renderer.current=r;setReady(true);}});return()=>{dead=true;renderer.current?.destroy();};},[]);
 useEffect(()=>{if(!ready)return;const c={...content,campaign:{...content.campaign!,initial:actorIds,recruits:[]}},s=createInitialState(c,1);s.campaign!.scene=scene;s.campaign!.hardware.office=level;s.campaign!.hardware.compute=level;
  for(const r of Object.values(s.campaign!.relations)){r.location=scene;r.locationUntil=1000;}
  if(scene==='workshop'){s.jobs[0]!.status='working';s.jobs[0]!.team=[{character:'bluewhale',role:'worker',mode:'local'},{character:'qwen',role:'reviewer',mode:'cloud'}];}
  for(const a of s.actors)if(scene!=='workshop')a.busyUntil=1;
  renderer.current!.update(getViewModel(s,c));
 },[ready,scene,level]);
 return <div class="studio-app"><div class="workshop" ref={host}/><div style="position:absolute;top:10px;left:10px;right:10px;background:#fff5df;padding:12px;color:#493a30"><b>DEV FIXTURE · 12 actors · no player save</b><div>{(['workshop','canteen','library'] as const).map(id=><button onClick={()=>setScene(id)}>{id}</button>)}{[0,1,3].map(n=><button onClick={()=>setLevel(n)}>Office {n}</button>)}</div><p>Selected: {picked||'none'} · {scene} · Office {level}</p></div></div>;
}
