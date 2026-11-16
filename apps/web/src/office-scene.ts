import {sceneBackground} from './scene-background.js';
import {visualReviewEnabled} from './visual-review.js';
import {Application,Assets,Container,Graphics,Sprite,Text,Texture} from 'pixi.js';
import 'pixi.js/unsafe-eval';
import type {GameView} from 'oot-platform';
import {PaperDoll} from './art/paper-doll.js';
import {loadVillageCharacter,activityPose,characterHeight} from './village-characters.js';
import {reactionFor,activeStationBonus} from './scene-layout.js';
import {officeCamera,clampZoom,clampOfficePan,zoomOfficeCamera,defaultCameraPan,slotPoint,actorPlacements,actorOutsideFrame,workLabelOffset,workFurnitureHitArea,separateOfficeLabels} from './office-scene-spec.js';
import type {CameraPan,CameraZone,OfficeFocus} from './office-scene-spec.js';
import {actorHitArea,furnitureHitArea} from './office-hit-area.js';
import {names} from './presentation.js';
import {sceneArt} from './studio-ui.js';
import {stepDampedCamera} from './ui2-logic.js';
import type {CameraTargetValues} from './ui2-logic.js';

type Walker={root:Container;shadow:Graphics;paper?:PaperDoll;badge:Container;badgeBg:Graphics;tag:Text;x:number;y:number;tx:number;ty:number;activity:string;id:string;zone:string;arrived:number;height:number;};

export async function createWorkshop(host:HTMLElement,onSelect:(id:string)=>void,onFurniture?: (id:string)=>void,onPresence?:(ids:string[])=>void,onCamera?:(next:{zoom:number;pan:CameraPan;clearFocus?:boolean|undefined})=>void){
 const app=new Application();await app.init({resizeTo:host,backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,preference:'webgl'});host.appendChild(app.canvas);app.canvas.setAttribute('aria-hidden','true');app.canvas.style.touchAction='none';
 const world=new Container(),labels=new Container(),mask=new Graphics(),pulseRing=new Graphics();world.sortableChildren=true;world.addChild(pulseRing);app.stage.addChild(world,labels,mask);world.mask=mask;labels.mask=mask;
 let latest:GameView|undefined,english=false,dead=false,paused=false,elapsed=0,zone:CameraZone='overview',zoom=1,pan:CameraPan=defaultCameraPan,size='',layout=false,lastScene='',layoutFocus:OfficeFocus=null,gestureMoved=false,suppressTapUntil=0,pinchDist=0;
 let camDisplay:CameraTargetValues|null=null,camBypass=true,pulseTimer=0,pulseTarget:{x:number;y:number}|null=null;
 const background=sceneBackground(host),inputAbort=new AbortController(),sig={signal:inputAbort.signal},pointers=new Map<number,{startX:number;startY:number;x:number;y:number}>();
 const fixed=visualReviewEnabled?Number(new URLSearchParams(location.search).get('animation-time')??NaN):NaN;
 let lastPresence='';
 const objects=new Map<string,{back:Container;front:Container;kind:string}>(),walkers=new Map<string,Walker>(),textures=new Map<string,Texture>(),requested=new Set<string>(),workHits=new Map<string,ReturnType<typeof workFurnitureHitArea>>();
 const hitKinds=['basic','standard','whiteboard','coffee','sofa','server','dining','reading'];

 function ensureWorkHit(key:string,t:Texture){
  let hit=workHits.get(key);
  if(!hit){const canvas=document.createElement('canvas');canvas.width=280;canvas.height=240;const context=canvas.getContext('2d')!;context.drawImage(t.source.resource as CanvasImageSource,0,0,280,240);hit=workFurnitureHitArea(context.getImageData(0,0,280,240).data);workHits.set(key,hit);}
  return hit;
 }
 function mountFurniture(node:Container,t:Texture,key:string,kind:string){
  const sprite=new Sprite(t);sprite.position.set(-140,-200);sprite.width=280;sprite.height=240;node.addChild(sprite);
  if(hitKinds.includes(kind))node.hitArea=workHits.get(key)??{contains(x:number,y:number){const hit=ensureWorkHit(key,t);node.hitArea=hit;return hit.contains(x,y);}};
 }
 function furniture(kind:string,layer:'front'|'back'){
  const key=kind+'-'+layer;
  if(!requested.has(key)){requested.add(key);void Assets.load<Texture>(`./art/office/${key}.svg`).then(t=>{
   if(dead)return;textures.set(key,t);
   for(const obj of objects.values())if(obj.kind===kind)mountFurniture(obj[layer],t,key,kind);
  }).catch(()=>{requested.delete(key);});}
  const node=new Container(),t=textures.get(key);if(t)mountFurniture(node,t,key,kind);return node;
 }

 function applyCameraValues(target:ReturnType<typeof officeCamera>,values:CameraTargetValues){
  world.position.set(values.x,values.y);world.scale.set(values.scale);
  mask.clear().rect(target.clip.x,target.clip.y,target.clip.width,target.clip.height).fill(0xffffff);
  host.style.backgroundSize=`${1920*values.scale}px ${1080*values.scale}px`;
  host.style.backgroundPosition=`${values.x}px ${values.y}px`;
  host.style.backgroundRepeat='no-repeat';
 }

 function sync(){if(!latest||dead)return;const v=latest,scene=v.campaign?.scene??'workshop',chapter=v.campaign?.chapter??0;layout=host.closest('[data-mode="layout"]')!==null;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='still'||Number.isFinite(fixed);
  if(scene!==lastScene){for(const a of walkers.values()){a.x=100;a.y=980;}lastScene=scene;}
  const targetCam=officeCamera(app.screen.width,app.screen.height,layout?'overview':zone,layoutFocus,layout?1:zoom,layout?defaultCameraPan:pan);
  if(!camDisplay||camBypass||still||layout)camDisplay={x:targetCam.x,y:targetCam.y,scale:targetCam.scale};
  applyCameraValues(targetCam,camDisplay);
  background.set(sceneArt(scene,chapter,v.absoluteSlot%4>=2),v.absoluteSlot%4>=2);
  const items=scene==='workshop'?(v.office?.items??[]):[{id:'public-table',kind:scene==='canteen'?'dining':'reading',slot:'meeting-1'}];
  const present=new Set(items.filter(i=>i.slot).map(i=>i.id));for(const [id,o] of objects)if(!present.has(id)){o.back.destroy({children:true});o.front.destroy({children:true});objects.delete(id);}
  for(const i of items){if(!i.slot)continue;let object=objects.get(i.id);if(object&&object.kind!==i.kind){object.back.destroy({children:true});object.front.destroy({children:true});objects.delete(i.id);object=undefined;}if(!object){object={kind:i.kind,back:furniture(i.kind,'back'),front:furniture(i.kind,'front')};objects.set(i.id,object);world.addChild(object.back,object.front);for(const layer of [object.back,object.front]){const key=i.kind+'-'+(layer===object.front?'front':'back');layer.eventMode='static';layer.cursor='pointer';if(!textures.has(key))layer.hitArea=hitKinds.includes(i.kind)?(workHits.get(key)??{contains:()=>false}):furnitureHitArea(i.kind,layer===object.front?'front':'back');else if(!hitKinds.includes(i.kind))layer.hitArea=furnitureHitArea(i.kind,layer===object.front?'front':'back');layer.on('pointertap',()=>{if(!gestureMoved&&performance.now()>=suppressTapUntil)onFurniture?.(i.id);});}}const p=slotPoint(i.slot,chapter);object.back.position.set(p.x,p.y);object.front.position.set(p.x,p.y);object.back.zIndex=p.y-2;object.front.zIndex=p.y+2;object.back.eventMode=layout?'none':'static';object.front.eventMode=layout?'none':'static';}
  const members=v.actors.filter(a=>a.location===scene);for(const [id,a] of walkers){a.root.visible=members.some(m=>m.id===id);a.badge.visible=a.root.visible;}
  const placements=actorPlacements(v);for(const a of members){let w=walkers.get(a.id);if(!w){const root=new Container(),badge=new Container(),badgeBg=new Graphics(),tag=new Text({text:names[a.id]??a.id,style:{fontSize:12,fill:0xfff7ea,fontFamily:'PingFang SC, Microsoft YaHei, sans-serif',fontWeight:'600'}});tag.anchor.set(.5,0);badge.addChild(badgeBg,tag);labels.addChild(badge);world.addChild(root);const shadow=new Graphics().ellipse(4,5,38,9).fill({color:0x3b2a1d,alpha:.09}).ellipse(3,4,28,6.5).fill({color:0x3b2a1d,alpha:.14}).ellipse(1,3,17,4).fill({color:0x2c1e14,alpha:.22});root.addChild(shadow);root.eventMode='static';root.cursor='pointer';root.hitArea=actorHitArea(false);root.on('pointertap',()=>{if(!gestureMoved&&performance.now()>=suppressTapUntil)onSelect(a.id);});w={id:a.id,root,shadow,badge,badgeBg,tag,x:100,y:980,tx:0,ty:0,activity:'idle',zone:'lounge',arrived:0,height:characterHeight(a.id,980)};walkers.set(a.id,w);const target=w;void loadVillageCharacter(a.id).then(rig=>{if(dead)return;target.paper=new PaperDoll(rig.character,rig.textures);target.paper.root.tint=0xfff5e8;target.paper.root.pivot.set(...rig.character.feet);target.paper.root.scale.set(target.height/rig.character.visibleHeight);target.root.addChild(target.paper.root);sync();}).catch(()=>{target.tag.text+=' · Art unavailable';});}
   w.root.visible=true;w.root.alpha=layout?.28:1;w.badge.visible=!layout;const r=v.office?.reservations[a.id];const placement=placements.find(p=>p.id===a.id)!,working=placement.activity,seated=placement.seated;
   w.height=characterHeight(a.id,placement.y);
   if(w.tx!==placement.x||w.ty!==placement.y)w.arrived=0;w.tx=placement.x;w.ty=placement.y;w.activity=working;w.zone=placement.zone;w.root.renderable=true;w.root.eventMode=layout?'none':'static';
   const bonus=activeStationBonus(v,a.id),boost=seated&&bonus>0?` ✦+${Math.round(bonus*100)}%`:'',tired=a.energy<35?' ⚡':'';
   w.tag.text=(names[a.id]??a.id)+(seated?(english?(camDisplay.scale<.6?'\n':' · ')+(r!.zone==='work'?'Work':'Meet')+boost:r!.zone==='work'?(camDisplay.scale<.6?'\n电脑':' · 电脑')+boost:(camDisplay.scale<.6?'\n会议':' · 会议')):'')+tired;
   const tw=Math.max(44,w.tag.width),th=Math.max(14,w.tag.height);w.badgeBg.clear().roundRect(-tw/2-8,-2,tw+16,th+4,9).fill({color:0x2e231b,alpha:.84}).stroke({color:boost?0xe2be78:0xb89664,width:1,alpha:.78});
  }
  tick(0);
 }

 function tick(ms:number){if(!latest)return;const still=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='still'||Number.isFinite(fixed);const targetCam=officeCamera(app.screen.width,app.screen.height,layout?'overview':zone,layoutFocus,layout?1:zoom,layout?defaultCameraPan:pan);
  if(ms>0){
   const damped=stepDampedCamera(camDisplay??{x:targetCam.x,y:targetCam.y,scale:targetCam.scale},{x:targetCam.x,y:targetCam.y,scale:targetCam.scale},ms,still||camBypass||pointers.size>0);
   camDisplay=damped.values;
   applyCameraValues(targetCam,camDisplay);
   if(damped.settled)camBypass=false;
  }
  const activeCam=camDisplay??{x:targetCam.x,y:targetCam.y,scale:targetCam.scale};
  if(pulseTarget&&pulseTimer>0&&!still){
   pulseTimer=Math.max(0,pulseTimer-ms);
   const progress=1-pulseTimer/1000;
   pulseRing.visible=true;pulseRing.position.set(pulseTarget.x,pulseTarget.y+100);pulseRing.zIndex=pulseTarget.y+101;
   pulseRing.clear().ellipse(0,0,28+progress*42,10+progress*16).stroke({color:0xf2d08c,width:2.5,alpha:Math.max(0,1-progress)});
  }else{pulseRing.visible=false;pulseTarget=null;}

  const outside:string[]=[];for(const w of walkers.values()){if(!w.root.visible)continue;const dx=w.tx-w.x,dy=w.ty-w.y,d=Math.hypot(dx,dy),step=Math.min(d,ms*.35);if(still){w.x=w.tx;w.y=w.ty;w.arrived=1;}else if(d>1){w.x+=dx/d*step;w.y+=dy/d*step;}else w.arrived=Math.min(1,w.arrived+ms/400);
   w.height=characterHeight(w.id,w.y);w.root.position.set(w.x,w.y);w.root.zIndex=w.y;const sit=w.zone==='work'?-48*w.arrived:0,deskSeated=w.zone==='work'&&w.arrived>.6;w.root.hitArea=actorHitArea(deskSeated);w.shadow.visible=!deskSeated;if(w.paper){w.paper.root.scale.set(w.height/w.paper.character.visibleHeight);w.paper.root.y=sit;for(const leg of ['leg-left','leg-right']){const n=w.paper.nodes.get(leg);if(n)n.visible=!deskSeated;}w.paper.apply(activityPose(w.paper.character,Number.isFinite(fixed)?fixed:elapsed,w.activity,!still&&d>2,reactionFor(latest,w.id),still));}
   if(actorOutsideFrame(w.x,w.y,w.height+(deskSeated?48:0),activeCam.scale,targetCam,app.screen.width,app.screen.height))outside.push(w.id);
   const tagOffset=w.zone==='work'?workLabelOffset:16;w.badge.position.set(activeCam.x+w.x*activeCam.scale,Math.min(targetCam.clip.y+targetCam.clip.height-w.badge.height-4,activeCam.y+(w.y+tagOffset)*activeCam.scale+(w.zone==='meeting'&&activeCam.scale<.8&&latest.office?.reservations[w.id]?.seat===1?22:0)));if(!outside.includes(w.id))w.badge.x=Math.max(targetCam.clip.x+w.badge.width/2,Math.min(targetCam.clip.x+targetCam.clip.width-w.badge.width/2,w.badge.x));w.badge.visible=!layout&&w.root.visible&&w.root.renderable&&w.badge.x-w.badge.width/2>=targetCam.clip.x&&w.badge.x+w.badge.width/2<=targetCam.clip.x+targetCam.clip.width;
  }
  const faces=[...walkers.values()].filter(w=>w.root.visible&&w.root.renderable).flatMap(w=>{const face=w.paper?.nodes.get('face');if(!face)return [];const b=face.getBounds();return [{x:b.x,y:b.y,width:b.width,height:b.height}];});
  for(const row of separateOfficeLabels([...walkers.values()].filter(w=>w.badge.visible).map(w=>({id:w.id,x:w.badge.x,y:w.badge.y-2,width:w.badge.width,height:w.badge.height})),app.screen.width,app.screen.height,faces)){const w=walkers.get(row.id)!;w.badge.position.set(row.x,row.y+2);}
  const presence=outside.join('|');if(presence!==lastPresence){lastPresence=presence;onPresence?.(outside);}
 }

 const localPt=(clientX:number,clientY:number)=>{const r=app.canvas.getBoundingClientRect();return {x:clientX-r.left,y:clientY-r.top};};
 const endPointer=(id:number)=>{if(!pointers.has(id))return;if(gestureMoved)suppressTapUntil=performance.now()+140;pointers.delete(id);if(pointers.size<2)pinchDist=0;if(pointers.size===1){const rem=[...pointers.values()][0]!;rem.startX=rem.x;rem.startY=rem.y;}try{if(app.canvas.hasPointerCapture(id))app.canvas.releasePointerCapture(id);}catch{}};
 app.canvas.addEventListener('pointerdown',e=>{if(dead||layout||paused||(e.pointerType==='mouse'&&e.button!==0&&e.button!==1))return;const pt=localPt(e.clientX,e.clientY);pointers.set(e.pointerId,{startX:pt.x,startY:pt.y,x:pt.x,y:pt.y});if(pointers.size===1){gestureMoved=false;pinchDist=0;}else if(pointers.size===2){gestureMoved=true;suppressTapUntil=performance.now()+180;const [a,b]=[...pointers.values()];pinchDist=Math.hypot(b!.x-a!.x,b!.y-a!.y);}try{app.canvas.setPointerCapture(e.pointerId);}catch{}},sig);
 app.canvas.addEventListener('pointermove',e=>{const cur=pointers.get(e.pointerId);if(!cur||dead||layout||paused)return;const pt=localPt(e.clientX,e.clientY);if(pointers.size===1){const dx=pt.x-cur.x,dy=pt.y-cur.y;if(!gestureMoved&&Math.hypot(pt.x-cur.startX,pt.y-cur.startY)>=5)gestureMoved=true;cur.x=pt.x;cur.y=pt.y;if(gestureMoved&&(dx!==0||dy!==0)){suppressTapUntil=performance.now()+150;camBypass=true;pan=clampOfficePan(app.screen.width,app.screen.height,zone,layoutFocus,zoom,{x:pan.x+dx,y:pan.y+dy});sync();onCamera?.({zoom,pan});}}else if(pointers.size>=2){const prev=[...pointers.values()],prevMid={x:(prev[0]!.x+prev[1]!.x)/2,y:(prev[0]!.y+prev[1]!.y)/2};cur.x=pt.x;cur.y=pt.y;const next=[...pointers.values()],nextMid={x:(next[0]!.x+next[1]!.x)/2,y:(next[0]!.y+next[1]!.y)/2},nextDist=Math.hypot(next[1]!.x-next[0]!.x,next[1]!.y-next[0]!.y);suppressTapUntil=performance.now()+180;const rawZoom=pinchDist>12&&nextDist>12?zoom*(nextDist/pinchDist):zoom;pinchDist=nextDist;const clearFocus=!!(layoutFocus&&rawZoom<zoom&&zoom<=1),effFocus=clearFocus?null:layoutFocus,targetZoom=clearFocus?1.3:rawZoom;const zed=zoomOfficeCamera(app.screen.width,app.screen.height,zone,effFocus,zoom,pan,targetZoom,nextMid);zoom=zed.zoom;pan=clampOfficePan(app.screen.width,app.screen.height,zone,effFocus,zoom,{x:zed.pan.x+(nextMid.x-prevMid.x),y:zed.pan.y+(nextMid.y-prevMid.y)});if(clearFocus)layoutFocus=null;camBypass=true;sync();onCamera?.({zoom,pan,clearFocus});}},sig);
 app.canvas.addEventListener('pointerup',e=>endPointer(e.pointerId),sig);
 app.canvas.addEventListener('pointercancel',e=>endPointer(e.pointerId),sig);
 app.canvas.addEventListener('lostpointercapture',e=>endPointer(e.pointerId),sig);
 app.canvas.addEventListener('wheel',e=>{if(dead||layout||paused||e.ctrlKey||e.metaKey)return;e.preventDefault();const pt=localPt(e.clientX,e.clientY),delta=Math.max(-100,Math.min(100,e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?app.screen.height:1))),rawZoom=zoom-delta*.002,clearFocus=!!(layoutFocus&&rawZoom<zoom&&zoom<=1),effFocus=clearFocus?null:layoutFocus,targetZoom=clearFocus?1.3:rawZoom;const zed=zoomOfficeCamera(app.screen.width,app.screen.height,zone,effFocus,zoom,pan,targetZoom,pt);zoom=zed.zoom;pan=zed.pan;if(clearFocus)layoutFocus=null;camBypass=true;sync();onCamera?.({zoom,pan,clearFocus});},{...sig,passive:false});
 for(const evt of ['gesturestart','gesturechange'] as const)app.canvas.addEventListener(evt,e=>e.preventDefault(),{...sig,passive:false});
 window.addEventListener('blur',()=>{pointers.clear();pinchDist=0;gestureMoved=false;},sig);
 app.ticker.add(t=>{if(dead||document.hidden||paused)return;const current=`${app.screen.width}/${app.screen.height}/${host.closest('[data-mode="layout"]')!==null}`;if(current!==size){size=current;camBypass=true;sync();}elapsed+=Math.min(t.deltaMS,50)/1000;tick(Math.min(t.deltaMS,50));});

 return {
  update(view:GameView,locale:'zh'|'en'='zh',previewFocus:OfficeFocus=null,cameraZone:CameraZone='overview',cameraZoom?:number,cameraPan?:CameraPan,isPaused=false){
   const focusChanged=(previewFocus?.x??null)!==(layoutFocus?.x??null)||(previewFocus?.y??null)!==(layoutFocus?.y??null);
   const zoneChanged=cameraZone!==zone;
   const nextZoom=cameraZoom!==undefined?clampZoom(cameraZoom):zoom;
   const nextPan=cameraPan!==undefined?cameraPan:pan;
   const instantDrag=Math.abs(nextZoom-zoom)<0.12&&(Math.abs(nextPan.x-pan.x)>0.01||Math.abs(nextPan.y-pan.y)>0.01)&&!focusChanged&&!zoneChanged;
   layoutFocus=previewFocus;zone=cameraZone;zoom=nextZoom;pan=nextPan;latest=view;english=locale==='en';paused=isPaused;
   camBypass=instantDrag||paused;
   if(focusChanged&&previewFocus){pulseTarget={x:previewFocus.x,y:previewFocus.y};pulseTimer=1000;}
   sync();
   if(paused)app.renderer.render(app.stage);
  },
  destroy(){dead=true;inputAbort.abort();background.destroy();app.destroy(true,{children:true});}
 };
}
