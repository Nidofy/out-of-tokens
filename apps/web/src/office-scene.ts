import {sceneBackground} from './scene-background.js';
import {visualReviewEnabled} from './visual-review.js';
import {Application,Assets,Container,Graphics,Sprite,Text,Texture,WebGLRenderer,loadEnvironmentExtensions} from 'pixi.js';
import 'pixi.js/unsafe-eval';
import type {CapacityExplanation,GameView} from 'oot-platform';
import {MapleChibiRig,PaperDollRigAdapter} from './art/maple-chibi-rig.js';
import {loadChibiFxBundle,loadMapleChibiRig,shouldUseChibiRig,warmChibiAssets} from './art/chibi-loader.js';
import {resolveActorBrain} from './art/actor-brain.js';
import type {CharacterVisualRig,Facing,PoiKind} from './art/chibi-types.js';
import {loadVillageCharacter,characterHeight} from './village-characters.js';
import {reactionFor} from './scene-layout.js';
import {officeCamera,clampZoom,clampOfficePan,zoomOfficeCamera,defaultCameraPan,slotPoint,actorPlacements,actorOutsideFrame,workFurnitureHitArea,separateOfficeLabels,syncWorkstationTarget,stepWorkstationTrajectory} from './office-scene-spec.js';
import type {CameraPan,CameraZone,OfficeFocus,WorkstationMotionState,WorkstationStage} from './office-scene-spec.js';
import {bakeOfficeNavGrid,extractOfficePois,findNavPath,pickRoamTarget} from './office-nav.js';
import type {NavPoint,OfficeNavGrid,OfficePoi} from './office-nav.js';
import {actorHitArea,furnitureHitArea} from './office-hit-area.js';
import {names} from './presentation.js';
import {sceneArt} from './studio-ui.js';
import {stepDampedCamera} from './ui2-logic.js';
import type {CameraTargetValues} from './ui2-logic.js';
import {fnvHash} from './living-adapter.js';
import {playFoley,readAudioPrefs} from './audio-foley.js';
import {decorPropArt} from './furniture-art.js';
import {
 ClickableDecorProp,
 FurnitureDynamicFx,
 decorPlacementsForScene,
 furnitureTintFor,
 isLegacyFurnitureFallbackActive,
 resolveFurnitureLayerUrl,
 resolveServerLoadLevel,
 warmModernFurnitureAssets
} from './art/furniture-rig.js';

const pixiEnvReady=typeof window!=='undefined'&&WebGLRenderer?loadEnvironmentExtensions(false):Promise.resolve();

export type ActorHeadAnchor={x:number;y:number;visible:boolean};
type Walker=WorkstationMotionState&{
 root:Container;shadow:Graphics;rig?:CharacterVisualRig;
 badge:Container;badgeBg:Graphics;tag:Text;lastTag:string;lastBoost:boolean;
 id:string;stage:WorkstationStage;height:number;
 facing:Facing;walkingBack:boolean;path:NavPoint[];poiId:string|null;poiKind:PoiKind;poiFacing:Facing;socialPartnerId:string|null;lastPrimaryFx:string|null;nextRoamAt:number;
};

export function warmWorkshopAssets(view:GameView){
 const scene=view.campaign?.scene??'workshop';
 warmChibiAssets(view);
 for(const a of view.actors)if(a.location===scene&&!shouldUseChibiRig(a.id))void loadVillageCharacter(a.id).catch(()=>{});
 warmModernFurnitureAssets(view);
}

export async function createWorkshop(host:HTMLElement,onSelect:(id:string)=>void,onFurniture?: (id:string)=>void,onPresence?:(ids:string[])=>void,onCamera?:(next:{zoom:number;pan:CameraPan;clearFocus?:boolean|undefined})=>void,onAnchors?:(anchors:Record<string,ActorHeadAnchor>)=>void,initialView?:GameView){
 const background=sceneBackground(host);
 await pixiEnvReady;
 if(initialView){
  const s0=initialView.campaign?.scene??'workshop',c0=initialView.campaign?.chapter??0,n0=initialView.absoluteSlot%4>=2;
  background.set(sceneArt(s0,c0,n0),n0);
  warmWorkshopAssets(initialView);
 }
 const app=new Application();await app.init({resizeTo:host,backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,preference:'webgl'});host.appendChild(app.canvas);app.canvas.setAttribute('aria-hidden','true');app.canvas.style.touchAction='none';
 const world=new Container(),labels=new Container(),mask=new Graphics(),pulseRing=new Graphics();world.sortableChildren=true;world.addChild(pulseRing);app.stage.addChild(world,labels,mask);world.mask=mask;labels.mask=mask;
 let latest:GameView|undefined,latestCapacity:Readonly<Record<string,CapacityExplanation>>|undefined,english=false,dead=false,paused=false,elapsed=0,zone:CameraZone='overview',zoom=1,pan:CameraPan=defaultCameraPan,size='',layout=false,lastScene='',layoutFocus:OfficeFocus=null,gestureMoved=false,suppressTapUntil=0,pinchDist=0;
 let camDisplay:CameraTargetValues|null=null,camBypass=true,syncedOnce=false,syncQueued=false,pulseTimer=0,pulseTarget:{x:number;y:number}|null=null,lastAnchorEmit=0,anchorDirty=true;
 const inputAbort=new AbortController(),sig={signal:inputAbort.signal},pointers=new Map<number,{startX:number;startY:number;x:number;y:number}>();
 const fixed=visualReviewEnabled?Number(new URLSearchParams(location.search).get('animation-time')??NaN):NaN;
 let lastPresence='';
 const objects=new Map<string,{back:Container;front:Container;backSprite?:Sprite|undefined;frontSprite?:Sprite|undefined;hasBack:boolean;hasFront:boolean;fx:FurnitureDynamicFx;kind:string;slot:string}>(),walkers=new Map<string,Walker>(),textures=new Map<string,Texture>(),requested=new Set<string>(),workHits=new Map<string,ReturnType<typeof workFurnitureHitArea>>();
 const decorProps=new Map<string,{scene:string;prop:ClickableDecorProp}>();
 const decorRequestedScenes=new Set<string>();
 const hitKinds=['basic','standard','whiteboard','coffee','sofa','server','dining','reading'];
 let navKey='',navGrid:OfficeNavGrid=bakeOfficeNavGrid([]),officePois:OfficePoi[]=[];

 function ensureSceneDecor(scene:string){
  if(decorRequestedScenes.has(scene)||isLegacyFurnitureFallbackActive())return;
  decorRequestedScenes.add(scene);
  const placements=decorPlacementsForScene(scene);
  void loadChibiFxBundle().catch(()=>undefined).then(fxBundle=>{
   if(dead)return;
   for(const spec of placements){
    const mapKey=`${scene}:${spec.id}`;
    void Assets.load<Texture>(decorPropArt(spec.id)).then(tex=>{
     if(dead||decorProps.has(mapKey))return;
     const prop=new ClickableDecorProp(spec,tex,fxBundle,tapped=>{
      if(gestureMoved||performance.now()<suppressTapUntil)return false;
      playFoley(tapped.foley,readAudioPrefs().sfx);
      return true;
     });
     prop.root.visible=(latest?.campaign?.scene??'workshop')===scene;
     decorProps.set(mapKey,{scene,prop});
     world.addChild(prop.root);
     queueSync();
    }).catch(()=>{});
   }
  });
 }

 function mountActorRig(target:Walker,id:string){
  const mountLegacy=()=>loadVillageCharacter(id).then(rig=>{
   if(dead)return;
   const adapter=new PaperDollRigAdapter(rig.character,rig.textures);
   target.rig=adapter;
   target.root.addChild(adapter.root);
   queueSync();
  });
  if(shouldUseChibiRig(id)){
   void Promise.all([loadMapleChibiRig(id),loadChibiFxBundle()]).then(([chibi,fx])=>{
    if(dead)return;
    const rig=new MapleChibiRig(chibi.data,chibi.textures,fx);
    target.rig=rig;
    target.root.addChild(rig.root);
    queueSync();
   }).catch(()=>mountLegacy()).catch(()=>{target.tag.text+=' · Art unavailable';});
  }else{
   void mountLegacy().catch(()=>{target.tag.text+=' · Art unavailable';});
  }
 }

 function ensureNav(scene:string,chapter:number,items:readonly {id:string;kind:string;slot:string|null}[]){
  const nextKey=`${scene}:${chapter}:${items.filter(i=>i.slot).map(i=>`${i.id}:${i.kind}:${i.slot}`).join(',')}`;
  if(nextKey===navKey)return;
  navKey=nextKey;
  const obstacles=items.filter(i=>i.slot).map(i=>({kind:i.kind,...slotPoint(i.slot!,chapter)}));
  navGrid=bakeOfficeNavGrid(obstacles);
  officePois=extractOfficePois(items,chapter,scene);
 }

 function ensureWorkHit(key:string,t:Texture){
  let hit=workHits.get(key);
  if(!hit){const canvas=document.createElement('canvas');canvas.width=280;canvas.height=240;const context=canvas.getContext('2d')!;context.drawImage(t.source.resource as CanvasImageSource,0,0,280,240);hit=workFurnitureHitArea(context.getImageData(0,0,280,240).data);workHits.set(key,hit);}
  return hit;
 }
 function mountFurniture(node:Container,t:Texture,key:string,kind:string):Sprite{
  const sprite=new Sprite(t);sprite.position.set(-140,-200);sprite.width=280;sprite.height=240;node.addChildAt(sprite,0);
  if(hitKinds.includes(kind))node.hitArea=workHits.get(key)??{contains(x:number,y:number){if(x<-140||x>=140||y<-200||y>=40)return false;const hit=ensureWorkHit(key,t);node.hitArea=hit;return hit.contains(x,y);}};
  return sprite;
 }
 function furniture(kind:string,layer:'front'|'back'){
  const resolved=resolveFurnitureLayerUrl(kind,layer);
  const node=new Container();
  if(!resolved)return {node,sprite:undefined as Sprite|undefined,key:null as string|null};
  const key=`${resolved.isLegacy?'svg':'webp'}:${kind}-${layer}`;
  if(!requested.has(key)){
   requested.add(key);
   const fallbackUrl=`./art/office/${kind}-${layer}.svg`;
   const loadTask=Assets.load<Texture>(resolved.url).catch(()=>resolved.isLegacy?Promise.reject(Error('SVG_LOAD_FAILED')):Assets.load<Texture>(fallbackUrl));
   void loadTask.then(t=>{
    if(dead)return;
    textures.set(key,t);
    for(const obj of objects.values()){
     if(obj.kind!==kind)continue;
     const sp=mountFurniture(obj[layer],t,key,kind);
     if(layer==='back')obj.backSprite=sp;else obj.frontSprite=sp;
    }
    queueSync();
   }).catch(()=>{requested.delete(key);});
  }
  const t=textures.get(key);
  const sprite=t?mountFurniture(node,t,key,kind):undefined;
  return {node,sprite,key};
 }

 function applyCameraValues(target:ReturnType<typeof officeCamera>,values:CameraTargetValues){
  world.position.set(values.x,values.y);world.scale.set(values.scale);
  mask.clear().rect(target.clip.x,target.clip.y,target.clip.width,target.clip.height).fill(0xffffff);
  host.style.backgroundSize=`${1920*values.scale}px ${1080*values.scale}px`;
  host.style.backgroundPosition=`${values.x}px ${values.y}px`;
  host.style.backgroundRepeat='no-repeat';
 }

 function isSceneStill(){
  if(Number.isFinite(fixed))return true;
  const pref=document.documentElement.dataset.motion;
  if(pref==='still')return true;
  if(pref==='full')return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
 }

 function queueSync(){if(syncQueued||dead)return;syncQueued=true;queueMicrotask(()=>{syncQueued=false;sync();});}
 function sync(){if(!latest||dead)return;const v=latest,scene=v.campaign?.scene??'workshop',chapter=v.campaign?.chapter??0;layout=host.closest('[data-mode="layout"]')!==null;
  const still=isSceneStill();
  if(scene!==lastScene){for(const a of walkers.values()){a.x=100;a.y=980;a.bx=100;a.by=980;a.tx=100;a.ty=980;a.stage='idle';a.station=null;a.arrived=0;a.path=[];a.poiId=null;a.poiKind=null;a.socialPartnerId=null;a.facing='right';a.walkingBack=false;a.nextRoamAt=0;}lastScene=scene;anchorDirty=true;}
  const targetCam=officeCamera(app.screen.width,app.screen.height,layout?'overview':zone,layoutFocus,layout?1:zoom,layout?defaultCameraPan:pan);
  if(!camDisplay||camBypass||still||layout)camDisplay={x:targetCam.x,y:targetCam.y,scale:targetCam.scale};
  applyCameraValues(targetCam,camDisplay);
  background.set(sceneArt(scene,chapter,v.absoluteSlot%4>=2),v.absoluteSlot%4>=2);
  const items=scene==='workshop'?(v.office?.items??[]):[{id:'public-table',kind:scene==='canteen'?'dining':'reading',slot:'meeting-1'}];
  ensureNav(scene,chapter,items);
  ensureSceneDecor(scene);
  for(const entry of decorProps.values())entry.prop.root.visible=entry.scene===scene;
  const present=new Set(items.filter(i=>i.slot).map(i=>i.id));for(const [id,o] of objects)if(!present.has(id)){o.back.destroy({children:true});o.front.destroy({children:true});objects.delete(id);}
  for(const i of items){if(!i.slot)continue;let object=objects.get(i.id);if(object&&object.kind!==i.kind){object.back.destroy({children:true});object.front.destroy({children:true});objects.delete(i.id);object=undefined;}if(!object){const backRes=furniture(i.kind,'back'),frontRes=furniture(i.kind,'front'),fx=new FurnitureDynamicFx(i.kind);backRes.node.addChild(fx.backFx);frontRes.node.addChild(fx.frontFx);object={kind:i.kind,slot:i.slot,back:backRes.node,front:frontRes.node,backSprite:backRes.sprite,frontSprite:frontRes.sprite,hasBack:backRes.key!==null,hasFront:frontRes.key!==null,fx};objects.set(i.id,object);world.addChild(object.back,object.front);for(const entry of [{node:object.back,key:backRes.key,side:'back' as const},{node:object.front,key:frontRes.key,side:'front' as const}]){if(!entry.key){entry.node.eventMode='none';continue;}entry.node.eventMode='static';entry.node.cursor='pointer';if(!textures.has(entry.key))entry.node.hitArea=hitKinds.includes(i.kind)?(workHits.get(entry.key)??{contains:()=>false}):furnitureHitArea(i.kind,entry.side);else if(!hitKinds.includes(i.kind))entry.node.hitArea=furnitureHitArea(i.kind,entry.side);entry.node.on('pointertap',()=>{if(!gestureMoved&&performance.now()>=suppressTapUntil)onFurniture?.(i.id);});}}object.slot=i.slot;const p=slotPoint(i.slot,chapter);object.back.position.set(p.x,p.y);object.front.position.set(p.x,p.y);object.back.zIndex=p.y-2;object.front.zIndex=p.y+2;object.back.eventMode=layout||!object.hasBack?'none':'static';object.front.eventMode=layout||!object.hasFront?'none':'static';}
  const members=v.actors.filter(a=>a.location===scene);for(const [id,a] of walkers){a.root.visible=members.some(m=>m.id===id);a.badge.visible=a.root.visible;}
  const placements=actorPlacements(v);for(const a of members){let w=walkers.get(a.id);if(!w){const root=new Container(),badge=new Container(),badgeBg=new Graphics(),tag=new Text({text:names[a.id]??a.id,style:{fontSize:12,fill:0xfff7ea,fontFamily:'PingFang SC, Microsoft YaHei, sans-serif',fontWeight:'600'}});tag.anchor.set(.5,0);badge.addChild(badgeBg,tag);labels.addChild(badge);world.addChild(root);const shadow=new Graphics().ellipse(4,5,38,9).fill({color:0x3b2a1d,alpha:.09}).ellipse(3,4,28,6.5).fill({color:0x3b2a1d,alpha:.14}).ellipse(1,3,17,4).fill({color:0x2c1e14,alpha:.22});root.addChild(shadow);root.eventMode='static';root.cursor='pointer';root.hitArea=actorHitArea(false);root.on('pointertap',()=>{if(!gestureMoved&&performance.now()>=suppressTapUntil)onSelect(a.id);});w={id:a.id,root,shadow,badge,badgeBg,tag,lastTag:'\0',lastBoost:false,stage:'idle',station:null,x:100,y:980,bx:100,by:980,tx:100,ty:980,activity:'idle',zone:'lounge',arrived:0,height:characterHeight(a.id,980),facing:'right',walkingBack:false,path:[],poiId:null,poiKind:null,poiFacing:'right',socialPartnerId:null,lastPrimaryFx:null,nextRoamAt:elapsed+1.4+(fnvHash(a.id)%240)/100};walkers.set(a.id,w);mountActorRig(w,a.id);}
   w.root.visible=true;w.root.alpha=layout?.28:1;w.badge.visible=!layout;const r=v.office?.reservations[a.id];const placement=placements.find(p=>p.id===a.id)!,seated=placement.seated;
   w.height=characterHeight(a.id,placement.y);
   const targetChanged=w.bx!==placement.x||w.by!==placement.y;
   const prevTx=w.tx,prevTy=w.ty;
   syncWorkstationTarget(w,placement,still);
   if(w.stage!=='idle'||still){w.path=[];w.poiId=null;w.poiKind=null;w.socialPartnerId=null;w.walkingBack=false;}
   else if(targetChanged){
    w.poiId=null;w.poiKind=null;w.socialPartnerId=null;
    w.path=Math.hypot(w.bx-w.x,w.by-w.y)>40?findNavPath(navGrid,{x:w.x,y:w.y},{x:w.bx,y:w.by}):[{x:w.bx,y:w.by}];
    const first=w.path[0];if(first){w.tx=first.x;w.ty=first.y;}else{w.tx=w.bx;w.ty=w.by;}
   }else{
    const head=w.path[0];
    w.tx=head?head.x:prevTx;
    w.ty=head?head.y:prevTy;
   }
   w.root.renderable=true;w.root.eventMode=layout?'none':'static';
   const bonus=latestCapacity?.[a.id]?.activeEfficiency??0,boost=seated&&bonus>0?` ✦+${Math.round(bonus*100)}%`:'',tired=a.energy<35?' ⚡':'';
   const hasBoost=!!boost,tagText=(names[a.id]??a.id)+(seated?(english?(camDisplay.scale<.6?'\n':' · ')+(r!.zone==='work'?'Work':'Meet')+boost:r!.zone==='work'?(camDisplay.scale<.6?'\n电脑':' · 电脑')+boost:(camDisplay.scale<.6?'\n会议':' · 会议')):'')+tired;
   if(tagText!==w.lastTag||hasBoost!==w.lastBoost){
    w.lastTag=tagText;w.lastBoost=hasBoost;w.tag.text=tagText;
    const tw=Math.max(44,w.tag.width),th=Math.max(14,w.tag.height);w.badgeBg.clear().roundRect(-tw/2-8,-2,tw+16,th+4,9).fill({color:0x2e231b,alpha:.84}).stroke({color:hasBoost?0xe2be78:0xb89664,width:1,alpha:.78});
   }
  }
  anchorDirty=true;
  tick(0);
 }

 function tick(ms:number){if(!latest)return;const still=isSceneStill();const targetCam=officeCamera(app.screen.width,app.screen.height,layout?'overview':zone,layoutFocus,layout?1:zoom,layout?defaultCameraPan:pan);
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

  const chapterNow=latest.campaign?.chapter??0,deskRows=(latest.campaign?.scene==='workshop'?(latest.office?.items??[]):[{kind:'dining',slot:'meeting-1'}]).filter(i=>i.slot&&['basic','standard'].includes(i.kind)).map(i=>slotPoint(i.slot!,chapterNow).y);
  const animTime=Number.isFinite(fixed)?fixed:elapsed;
  const night=latest.absoluteSlot%4>=2;
  const occupiedItems=new Set<string>();
  const overloadedItems=new Set<string>();
  let anyOverloaded=false;
  let coffeeActive=false;
  const sitOffsets=new Map<string,number>();
  const outside:string[]=[];for(const w of walkers.values()){if(!w.root.visible)continue;
   if(w.stage==='idle'){
    if(still||paused||layout||Number.isFinite(fixed)){
     w.path=[];w.poiId=null;w.poiKind=null;w.socialPartnerId=null;w.tx=w.bx;w.ty=w.by;w.facing='right';w.walkingBack=false;
    }else{
     if(w.path.length>0){
      while(w.path.length>1&&Math.hypot(w.path[0]!.x-w.x,w.path[0]!.y-w.y)<=8)w.path.shift();
      const head=w.path[0]!;w.tx=head.x;w.ty=head.y;
      if(w.path.length===1&&Math.hypot(head.x-w.x,head.y-w.y)<=2){
       w.path.shift();
       w.nextRoamAt=elapsed+3.2+(fnvHash(`${w.id}:dwell:${Math.floor(elapsed*10)}`)%320)/100;
       if(w.poiKind==='social'&&w.socialPartnerId){
        const buddy=walkers.get(w.socialPartnerId);
        if(buddy&&buddy.root.visible&&buddy.stage==='idle'&&buddy.path.length===0&&Math.hypot(buddy.x-w.x,buddy.y-w.y)<180){
         buddy.facing=w.x>=buddy.x?'right':'left';
         buddy.poiKind='social';buddy.poiFacing=buddy.facing;
         buddy.nextRoamAt=Math.max(buddy.nextRoamAt,elapsed+2.8);
        }
       }
      }
     }else if(w.zone==='lounge'&&(w.activity==='idle'||w.activity==='rest')&&w.arrived>=1&&elapsed>=w.nextRoamAt){
      const actor=latest.actors.find(a=>a.id===w.id);
      const preferRest=w.activity==='rest'||(actor?.energy??100)<40;
      const occupied=[...walkers.values()].filter(o=>o.id!==w.id&&o.root.visible).map(o=>({x:o.path.at(-1)?.x??o.tx,y:o.path.at(-1)?.y??o.ty}));
      const reservedPoiIds=new Set<string>();
      const socialPeers:{id:string;x:number;y:number}[]=[];
      for(const o of walkers.values()){
       if(o.id===w.id||!o.root.visible)continue;
       if(o.poiId)reservedPoiIds.add(o.poiId);
       if(o.stage==='idle'&&o.zone==='lounge'&&o.activity==='idle'&&o.path.length===0&&o.arrived>=1)socialPeers.push({id:o.id,x:o.x,y:o.y});
      }
      const choice=pickRoamTarget({actorId:w.id,seedKey:`${Math.floor(elapsed*10)}:${latest.absoluteSlot}`,preferRest,origin:{x:w.bx,y:w.by},current:{x:w.x,y:w.y},grid:navGrid,pois:officePois,occupied,reservedPoiIds,socialPeers});
      w.poiId=choice.poiId;w.poiKind=choice.poiKind;w.poiFacing=choice.facing;w.socialPartnerId=choice.socialPartnerId??null;
      w.path=findNavPath(navGrid,{x:w.x,y:w.y},choice.point);
      const first=w.path[0];if(first){w.tx=first.x;w.ty=first.y;}
      w.nextRoamAt=elapsed+3.5+(fnvHash(`${w.id}:wait:${Math.floor(elapsed)}`)%300)/100;
     }
    }
   }else{
    w.path=[];w.poiId=null;w.poiKind=null;w.socialPartnerId=null;
   }
   const prevX=w.x,prevY=w.y;
   const step=stepWorkstationTrajectory(w,ms,still,deskRows);
   const sit=step.sit,deskSeated=step.deskSeated;sitOffsets.set(w.id,sit);
   if(still){w.facing='right';w.walkingBack=false;}
   else if(step.walking){
    const stepDx=w.x-prevX,stepDy=w.y-prevY;
    if(Math.abs(stepDx)>0.75)w.facing=stepDx>0?'right':'left';
    w.walkingBack=stepDy<-0.55&&Math.abs(stepDy)>Math.abs(stepDx)*1.15;
   }else{
    w.walkingBack=false;
    if(w.poiKind&&!deskSeated)w.facing=w.poiFacing;
   }
   w.height=characterHeight(w.id,step.scaleY);w.root.position.set(w.x,w.y);w.root.zIndex=step.zIndex;w.root.hitArea=actorHitArea(deskSeated);w.shadow.visible=!deskSeated;
   if(w.rig){
    const overloaded=!!latestCapacity?.[w.id]?.overloaded;
    if(overloaded)anyOverloaded=true;
    const reservedItem=latest.office?.reservations[w.id]?.item;
    if(deskSeated&&reservedItem){
     occupiedItems.add(reservedItem);
     if(overloaded)overloadedItems.add(reservedItem);
    }
    if(w.poiKind==='coffee'&&w.path.length===0)coffeeActive=true;
    const reaction=reactionFor(latest,w.id,overloaded);
    const brain=resolveActorBrain({view:latest,actorId:w.id,activity:w.activity,zone:w.zone,deskSeated,walking:step.walking,walkingBack:w.walkingBack,reaction,overloaded,poiKind:w.poiKind,elapsed:animTime,still});
    if(!still&&ms>0&&brain.primaryFx&&brain.primaryFx!==w.lastPrimaryFx&&['emote-excited','emote-heart','emote-alert','emote-spark'].includes(brain.primaryFx)){
     playFoley('emote',readAudioPrefs().sfx);
    }
    w.lastPrimaryFx=brain.primaryFx;
    w.rig.update({elapsed:animTime,dtMs:ms,height:w.height,sitOffset:sit,deskSeated,walking:step.walking,walkingBack:w.walkingBack,facing:w.facing,activity:w.activity,reaction,brain,still});
   }
   if(actorOutsideFrame(w.x,w.y,w.height+(deskSeated?48:0),activeCam.scale,targetCam,app.screen.width,app.screen.height))outside.push(w.id);
   const tagOffset=step.tagOffset;w.badge.position.set(activeCam.x+w.x*activeCam.scale,Math.min(targetCam.clip.y+targetCam.clip.height-w.badge.height-4,activeCam.y+(w.y+tagOffset)*activeCam.scale+(w.zone==='meeting'&&activeCam.scale<.8&&latest.office?.reservations[w.id]?.seat===1?22:0)));if(!outside.includes(w.id))w.badge.x=Math.max(targetCam.clip.x+w.badge.width/2,Math.min(targetCam.clip.x+targetCam.clip.width-w.badge.width/2,w.badge.x));w.badge.visible=!layout&&w.root.visible&&w.root.renderable&&w.badge.x-w.badge.width/2>=targetCam.clip.x&&w.badge.x+w.badge.width/2<=targetCam.clip.x+targetCam.clip.width;
  }
  const furnTint=furnitureTintFor(night);
  const legacyFurn=isLegacyFurnitureFallbackActive();
  const serverLoad=resolveServerLoadLevel(latest,anyOverloaded);
  for(const [id,obj] of objects){
   if(obj.backSprite)obj.backSprite.tint=legacyFurn?0xffffff:furnTint;
   if(obj.frontSprite)obj.frontSprite.tint=legacyFurn?0xffffff:furnTint;
   if(!legacyFurn){
    obj.fx.update({
     elapsed:animTime,
     dtMs:ms,
     occupied:occupiedItems.has(id),
     overloaded:overloadedItems.has(id),
     coffeeActive,
     serverLoad,
     night,
     still,
     backSprite:obj.backSprite
    });
   }
  }
  for(const entry of decorProps.values()){
   if(entry.prop.root.visible)entry.prop.update(animTime,ms,night,layout,still);
  }
  const faces=[...walkers.values()].filter(w=>w.root.visible&&w.root.renderable).flatMap(w=>{const b=w.rig?.getFaceBounds();return b?[b]:[];});
  for(const row of separateOfficeLabels([...walkers.values()].filter(w=>w.badge.visible).map(w=>({id:w.id,x:w.badge.x,y:w.badge.y-2,width:w.badge.width,height:w.badge.height})),app.screen.width,app.screen.height,faces)){const w=walkers.get(row.id)!;w.badge.position.set(row.x,row.y+2);}
  const presence=outside.join('|');if(presence!==lastPresence){lastPresence=presence;onPresence?.(outside);}
  if(onAnchors&&(anchorDirty||ms===0||elapsed-lastAnchorEmit>=0.08)){
   anchorDirty=false;lastAnchorEmit=elapsed;
   const anchors:Record<string,ActorHeadAnchor>={};
   for(const w of walkers.values()){
    const sitY=sitOffsets.get(w.id)??(w.zone==='work'?-48*w.arrived:0);
    const head=w.rig?w.rig.getHeadAnchorOffset(w.height,sitY):{x:0,y:sitY-w.height};
    anchors[w.id]={x:Math.round(activeCam.x+(w.x+head.x)*activeCam.scale),y:Math.round(activeCam.y+(w.y+head.y)*activeCam.scale),visible:!layout&&w.root.visible&&w.root.renderable&&!outside.includes(w.id)};
   }
   onAnchors(anchors);
  }
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
  update(view:GameView,locale:'zh'|'en'='zh',previewFocus:OfficeFocus=null,cameraZone:CameraZone='overview',cameraZoom?:number,cameraPan?:CameraPan,isPaused=false,capacityByActor?:Readonly<Record<string,CapacityExplanation>>){
   const focusChanged=(previewFocus?.x??null)!==(layoutFocus?.x??null)||(previewFocus?.y??null)!==(layoutFocus?.y??null);
   const zoneChanged=cameraZone!==zone;
   const nextZoom=cameraZoom!==undefined?clampZoom(cameraZoom):zoom;
   const nextPan=cameraPan!==undefined?cameraPan:pan;
   const nextEnglish=locale==='en';
   const layoutNow=host.closest('[data-mode="layout"]')!==null;
   const viewChanged=view!==latest||nextEnglish!==english||capacityByActor!==latestCapacity||layoutNow!==layout;
   const camChanged=focusChanged||zoneChanged||Math.abs(nextZoom-zoom)>0.0001||Math.abs(nextPan.x-pan.x)>0.01||Math.abs(nextPan.y-pan.y)>0.01;
   const instantDrag=Math.abs(nextZoom-zoom)<0.12&&(Math.abs(nextPan.x-pan.x)>0.01||Math.abs(nextPan.y-pan.y)>0.01)&&!focusChanged&&!zoneChanged;
   layoutFocus=previewFocus;zone=cameraZone;zoom=nextZoom;pan=nextPan;latest=view;latestCapacity=capacityByActor;english=nextEnglish;paused=isPaused;
   camBypass=instantDrag||paused;
   if(focusChanged&&previewFocus){pulseTarget={x:previewFocus.x,y:previewFocus.y};pulseTimer=1000;}
   if(syncedOnce&&!viewChanged&&!camChanged)return;
   syncedOnce=true;
   sync();
   if(paused)app.renderer.render(app.stage);
  },
  destroy(){dead=true;inputAbort.abort();decorProps.clear();background.destroy();app.destroy(true,{children:true});}
 };
}
