import {Application,Assets,Container,Graphics,Rectangle,Sprite,Text,Texture} from 'pixi.js';
import 'pixi.js/unsafe-eval';
import type {GameView} from 'oot-platform';
import {PaperDoll} from './art/paper-doll.js';
import {loadVillageCharacter,activityPose} from './village-characters.js';
import {activityFor,reactionFor} from './scene-layout.js';
import {officeCamera,slotPoint,idlePoint,zoneNames} from './office-scene-spec.js';
import type {CameraZone} from './office-scene-spec.js';
import {names} from './presentation.js';
import {sceneArt} from './studio-ui.js';
type Walker={root:Container;paper?:PaperDoll;tag:Text;x:number;y:number;tx:number;ty:number;activity:string;id:string;zone:string;arrived:number;height:number;};
export async function createWorkshop(host:HTMLElement,onSelect:(id:string)=>void,onFurniture?:(id:string)=>void){
 const app=new Application();await app.init({resizeTo:host,backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,preference:'webgl'});host.appendChild(app.canvas);app.canvas.setAttribute('aria-hidden','true');
 const world=new Container(),labels=new Container(),mask=new Graphics();world.sortableChildren=true;app.stage.addChild(world,labels,mask);world.mask=mask;labels.mask=mask;
 let latest:GameView|undefined,english=false,dead=false,elapsed=0,zone:CameraZone=host.clientWidth<1000?'work-left':'overview',size='',layout=false,lastScene='';
 const fixed=import.meta.env.DEV?Number(new URLSearchParams(location.search).get('animation-time')??NaN):NaN;
 const controls=document.createElement('nav');controls.className='office-camera';controls.setAttribute('aria-label','场景视角 / Scene camera');host.appendChild(controls);
 const buttons=new Map<CameraZone,HTMLButtonElement>();for(const id of Object.keys(zoneNames) as CameraZone[]){const b=document.createElement('button');b.onclick=()=>{zone=id;sync();};controls.appendChild(b);buttons.set(id,b);}
 const objects=new Map<string,{back:Container;front:Container;kind:string}>(),walkers=new Map<string,Walker>(),textures=new Map<string,Texture>(),requested=new Set<string>();
 function furniture(kind:string,layer:string){const key=kind+'-'+layer;if(!requested.has(key)){requested.add(key);void Assets.load<Texture>(`./art/office/${key}.svg`).then(t=>{if(!dead){textures.set(key,t);for(const [id,obj] of objects)if(obj.kind===kind){obj.back.destroy({children:true});obj.front.destroy({children:true});objects.delete(id);}sync();}}).catch(()=>{requested.delete(key);});}const node=new Container(),t=textures.get(key);if(t){const sprite=new Sprite(t);sprite.position.set(-140,-200);sprite.width=280;sprite.height=240;node.addChild(sprite);}return node;}
 function sync(){if(!latest||dead)return;const v=latest,scene=v.campaign?.scene??'workshop',chapter=v.campaign?.chapter??0;layout=host.closest('[data-mode="layout"]')!==null;
  if(scene!==lastScene){for(const a of walkers.values()){a.x=100;a.y=980;}lastScene=scene;}
  for(const [id,b] of buttons){b.textContent=zoneNames[id][english?1:0];b.setAttribute('aria-pressed',String(zone===id));}
  const cam=officeCamera(app.screen.width,app.screen.height,zone,layout);world.position.set(cam.x,cam.y);world.scale.set(cam.scale);mask.clear().rect(cam.clip.x,cam.clip.y,cam.clip.width,cam.clip.height).fill(0xffffff);
  host.style.backgroundImage=`url("${sceneArt(scene,chapter)}")`;host.style.backgroundSize=`${1920*cam.scale}px ${1080*cam.scale}px`;host.style.backgroundPosition=`${cam.x}px ${cam.y}px`;host.style.backgroundRepeat='no-repeat';
  const items=scene==='workshop'?(v.office?.items??[]):[{id:'public-table',kind:scene==='canteen'?'dining':'reading',slot:'meeting-1'}];
  const present=new Set(items.filter(i=>i.slot).map(i=>i.id));for(const [id,o] of objects)if(!present.has(id)){o.back.destroy({children:true});o.front.destroy({children:true});objects.delete(id);}
  for(const i of items){if(!i.slot)continue;let object=objects.get(i.id);if(object&&object.kind!==i.kind){object.back.destroy({children:true});object.front.destroy({children:true});objects.delete(i.id);object=undefined;}if(!object){object={kind:i.kind,back:furniture(i.kind,'back'),front:furniture(i.kind,'front')};objects.set(i.id,object);world.addChild(object.back,object.front);for(const layer of [object.back,object.front]){layer.eventMode='static';layer.cursor='pointer';layer.hitArea=new Rectangle(-140,-200,280,240);layer.on('pointertap',()=>onFurniture?.(i.id));}}const p=slotPoint(i.slot,chapter);object.back.position.set(p.x,p.y);object.front.position.set(p.x,p.y);object.back.zIndex=p.y-2;object.front.zIndex=p.y+2;}
  const members=v.actors.filter(a=>a.location===scene);for(const [id,a] of walkers){a.root.visible=members.some(m=>m.id===id);a.tag.visible=a.root.visible;}
  let idle=0;for(const a of members){let w=walkers.get(a.id);if(!w){const root=new Container(),tag=new Text({text:names[a.id]??a.id,style:{fontSize:12,fill:0x493a30,fontFamily:'Microsoft YaHei, sans-serif',fontWeight:'600',stroke:{color:0xfff7e5,width:5}}});tag.anchor.set(.5,0);labels.addChild(tag);world.addChild(root);root.addChild(new Graphics().ellipse(0,5,45,10).fill({color:0x4b3829,alpha:.18}));root.eventMode='static';root.cursor='pointer';root.hitArea=new Rectangle(-85,-280,170,315);root.on('pointertap',()=>onSelect(a.id));w={id:a.id,root,tag,x:100,y:980,tx:0,ty:0,activity:'idle',zone:'lounge',arrived:0,height:280};walkers.set(a.id,w);const target=w;void loadVillageCharacter(a.id).then(rig=>{if(dead)return;target.paper=new PaperDoll(rig.character,rig.textures);target.paper.root.pivot.set(...rig.character.feet);target.paper.root.scale.set(280/rig.character.visibleHeight);target.root.addChild(target.paper.root);sync();}).catch(()=>{target.tag.text+=' · Art unavailable';});}
   w.root.visible=true;w.tag.visible=true;const r=v.office?.reservations[a.id],item=r&&v.office?.items.find(i=>i.id===r.item);const working=activityFor(v,a.id);const seated=scene==='workshop'&&item?.slot&&['work','review','think'].includes(working);
   w.height=!seated&&members.length>4?130:seated?280:200;
   const p=seated?slotPoint(item.slot!,chapter):scene==='workshop'?idlePoint(idle++,members.length):{x:600+(idle%4)*300,y:750+Math.floor(idle++/4)*130};
   const targetX=p.x+(seated&&r?.zone==='meeting'?(r.seat===0?-72:72):0);if(w.tx!==targetX||w.ty!==p.y){w.arrived=0;}w.tx=targetX;w.ty=p.y;w.activity=working;w.zone=seated?r!.zone:'lounge';w.root.renderable=scene!=='workshop'||zone==='overview'||zone==='work-left'&&w.zone==='work'&&w.tx<1200||zone==='work-right'&&w.zone==='work'&&w.tx>=1200||zone===w.zone;w.root.eventMode=w.root.renderable?'static':'none';
   w.tag.text=(names[a.id]??a.id)+(seated?(english?' · '+r!.zone:r!.zone==='work'?' · 电脑':' · 会议'):(english?' · Available':' · 可安排'));
  }
  tick(0);
 }
 function tick(ms:number){if(!latest)return;const still=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='still'||Number.isFinite(fixed);const cam=officeCamera(app.screen.width,app.screen.height,zone,layout);
  for(const w of walkers.values()){if(!w.root.visible)continue;const dx=w.tx-w.x,dy=w.ty-w.y,d=Math.hypot(dx,dy),step=Math.min(d,ms*.35);if(still){w.x=w.tx;w.y=w.ty;w.arrived=1;}else if(d>1){w.x+=dx/d*step;w.y+=dy/d*step;}else w.arrived=Math.min(1,w.arrived+ms/400);
   w.root.position.set(w.x,w.y);w.root.zIndex=w.y;const sit=w.zone==='work'?w.arrived*12:0;if(w.paper){w.paper.root.scale.set(w.height/w.paper.character.visibleHeight);w.paper.root.y=sit;w.paper.apply(activityPose(w.paper.character,Number.isFinite(fixed)?fixed:elapsed,w.activity,!still&&d>2,reactionFor(latest,w.id),still));}
   w.tag.position.set(cam.x+w.x*cam.scale,Math.min(cam.clip.y+cam.clip.height-18,cam.y+(w.y+35)*cam.scale));w.tag.visible=w.root.visible&&w.root.renderable&&w.tag.x>cam.clip.x+45&&w.tag.x<cam.clip.x+cam.clip.width-45;
  }
 }
 app.ticker.add(t=>{if(dead||document.hidden)return;const current=`${app.screen.width}/${app.screen.height}/${host.closest('[data-mode="layout"]')!==null}`;if(current!==size){size=current;sync();}elapsed+=Math.min(t.deltaMS,50)/1000;tick(Math.min(t.deltaMS,50));});
 return {update(view:GameView,locale:'zh'|'en'='zh'){latest=view;english=locale==='en';sync();},destroy(){dead=true;controls.remove();app.destroy(true,{children:true});}};
}
