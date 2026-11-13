import {sceneBackground} from './scene-background.js';
import {visualReviewEnabled} from './visual-review.js';
import {Application,Assets,Container,Graphics,Sprite,Text,Texture} from 'pixi.js';
import 'pixi.js/unsafe-eval';
import type {GameView} from 'oot-platform';
import {PaperDoll} from './art/paper-doll.js';
import {loadVillageCharacter,activityPose,characterHeight} from './village-characters.js';
import {reactionFor,activeStationBonus} from './scene-layout.js';
import {officeCamera,slotPoint,actorPlacements,actorOutsideFrame,workLabelOffset,workFurnitureHitArea,separateOfficeLabels} from './office-scene-spec.js';
import type {CameraZone,OfficeFocus} from './office-scene-spec.js';
import {actorHitArea,furnitureHitArea} from './office-hit-area.js';
import {names} from './presentation.js';
import {sceneArt} from './studio-ui.js';
type Walker={root:Container;shadow:Graphics;paper?:PaperDoll;badge:Container;badgeBg:Graphics;tag:Text;x:number;y:number;tx:number;ty:number;activity:string;id:string;zone:string;arrived:number;height:number;};
export async function createWorkshop(host:HTMLElement,onSelect:(id:string)=>void,onFurniture?: (id:string)=>void,onPresence?:(ids:string[])=>void){
 const app=new Application();await app.init({resizeTo:host,backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,preference:'webgl'});host.appendChild(app.canvas);app.canvas.setAttribute('aria-hidden','true');
 const world=new Container(),labels=new Container(),mask=new Graphics();world.sortableChildren=true;app.stage.addChild(world,labels,mask);world.mask=mask;labels.mask=mask;
 let latest:GameView|undefined,english=false,dead=false,elapsed=0,zone:CameraZone='overview',size='',layout=false,lastScene='',layoutFocus:OfficeFocus=null;
 const background=sceneBackground(host);
 const fixed=visualReviewEnabled?Number(new URLSearchParams(location.search).get('animation-time')??NaN):NaN;
 let lastPresence='';
 const objects=new Map<string,{back:Container;front:Container;kind:string}>(),walkers=new Map<string,Walker>(),textures=new Map<string,Texture>(),requested=new Set<string>(),workHits=new Map<string,ReturnType<typeof workFurnitureHitArea>>();
 function mountFurniture(node:Container,t:Texture,key:string){const sprite=new Sprite(t);sprite.position.set(-140,-200);sprite.width=280;sprite.height=240;node.addChild(sprite);const hit=workHits.get(key);if(hit)node.hitArea=hit;}
 function furniture(kind:string,layer:'front'|'back'){
  const key=kind+'-'+layer;
  if(!requested.has(key)){requested.add(key);void Assets.load<Texture>(`./art/office/${key}.svg`).then(t=>{
   if(dead)return;textures.set(key,t);
   if(['basic','standard','whiteboard','coffee','sofa','server','dining','reading'].includes(kind)){const canvas=document.createElement('canvas');canvas.width=280;canvas.height=240;const context=canvas.getContext('2d')!;context.drawImage(t.source.resource as CanvasImageSource,0,0,280,240);workHits.set(key,workFurnitureHitArea(context.getImageData(0,0,280,240).data));}
   // Preserve the sibling layer, listeners, camera position and layout event mode.
   for(const obj of objects.values())if(obj.kind===kind)mountFurniture(obj[layer],t,key);
  }).catch(()=>{requested.delete(key);});}
  const node=new Container(),t=textures.get(key);if(t)mountFurniture(node,t,key);return node;
 }
 function sync(){if(!latest||dead)return;const v=latest,scene=v.campaign?.scene??'workshop',chapter=v.campaign?.chapter??0;layout=host.closest('[data-mode="layout"]')!==null;
  if(scene!==lastScene){for(const a of walkers.values()){a.x=100;a.y=980;}lastScene=scene;}
  const cam=officeCamera(app.screen.width,app.screen.height,layout?'overview':zone,layoutFocus);world.position.set(cam.x,cam.y);world.scale.set(cam.scale);mask.clear().rect(cam.clip.x,cam.clip.y,cam.clip.width,cam.clip.height).fill(0xffffff);
  background.set(sceneArt(scene,chapter,v.absoluteSlot%4>=2),v.absoluteSlot%4>=2);host.style.backgroundSize=`${1920*cam.scale}px ${1080*cam.scale}px`;host.style.backgroundPosition=`${cam.x}px ${cam.y}px`;host.style.backgroundRepeat='no-repeat';
  const items=scene==='workshop'?(v.office?.items??[]):[{id:'public-table',kind:scene==='canteen'?'dining':'reading',slot:'meeting-1'}];
  const present=new Set(items.filter(i=>i.slot).map(i=>i.id));for(const [id,o] of objects)if(!present.has(id)){o.back.destroy({children:true});o.front.destroy({children:true});objects.delete(id);}
  for(const i of items){if(!i.slot)continue;let object=objects.get(i.id);if(object&&object.kind!==i.kind){object.back.destroy({children:true});object.front.destroy({children:true});objects.delete(i.id);object=undefined;}if(!object){object={kind:i.kind,back:furniture(i.kind,'back'),front:furniture(i.kind,'front')};objects.set(i.id,object);world.addChild(object.back,object.front);for(const layer of [object.back,object.front]){layer.eventMode='static';layer.cursor='pointer';layer.hitArea=['basic','standard','whiteboard','coffee','sofa','server','dining','reading'].includes(i.kind)?(workHits.get(i.kind+'-'+(layer===object.front?'front':'back'))??{contains:()=>false}):furnitureHitArea(i.kind,layer===object.front?'front':'back');layer.on('pointertap',()=>onFurniture?.(i.id));}}const p=slotPoint(i.slot,chapter);object.back.position.set(p.x,p.y);object.front.position.set(p.x,p.y);object.back.zIndex=p.y-2;object.front.zIndex=p.y+2;object.back.eventMode=layout?'none':'static';object.front.eventMode=layout?'none':'static';}
  const members=v.actors.filter(a=>a.location===scene);for(const [id,a] of walkers){a.root.visible=members.some(m=>m.id===id);a.badge.visible=a.root.visible;}
  const placements=actorPlacements(v);for(const a of members){let w=walkers.get(a.id);if(!w){const root=new Container(),badge=new Container(),badgeBg=new Graphics(),tag=new Text({text:names[a.id]??a.id,style:{fontSize:12,fill:0xfff7ea,fontFamily:'PingFang SC, Microsoft YaHei, sans-serif',fontWeight:'600'}});tag.anchor.set(.5,0);badge.addChild(badgeBg,tag);labels.addChild(badge);world.addChild(root);const shadow=new Graphics().ellipse(4,5,38,9).fill({color:0x3b2a1d,alpha:.09}).ellipse(3,4,28,6.5).fill({color:0x3b2a1d,alpha:.14}).ellipse(1,3,17,4).fill({color:0x2c1e14,alpha:.22});root.addChild(shadow);root.eventMode='static';root.cursor='pointer';root.hitArea=actorHitArea(false);root.on('pointertap',()=>onSelect(a.id));w={id:a.id,root,shadow,badge,badgeBg,tag,x:100,y:980,tx:0,ty:0,activity:'idle',zone:'lounge',arrived:0,height:characterHeight(a.id,980)};walkers.set(a.id,w);const target=w;void loadVillageCharacter(a.id).then(rig=>{if(dead)return;target.paper=new PaperDoll(rig.character,rig.textures);target.paper.root.tint=0xfff5e8;target.paper.root.pivot.set(...rig.character.feet);target.paper.root.scale.set(target.height/rig.character.visibleHeight);target.root.addChild(target.paper.root);sync();}).catch(()=>{target.tag.text+=' · Art unavailable';});}
   w.root.visible=true;w.root.alpha=layout?.28:1;w.badge.visible=!layout;const r=v.office?.reservations[a.id];const placement=placements.find(p=>p.id===a.id)!,working=placement.activity,seated=placement.seated;
   w.height=characterHeight(a.id,placement.y);
   if(w.tx!==placement.x||w.ty!==placement.y)w.arrived=0;w.tx=placement.x;w.ty=placement.y;w.activity=working;w.zone=placement.zone;w.root.renderable=true;w.root.eventMode=layout?'none':'static';
   const bonus=activeStationBonus(v,a.id),boost=seated&&bonus>0?` ✦+${Math.round(bonus*100)}%`:'',tired=a.energy<35?' ⚡':'';
   w.tag.text=(names[a.id]??a.id)+(seated?(english?(cam.scale<.6?'\n':' · ')+(r!.zone==='work'?'Work':'Meet')+boost:r!.zone==='work'?(cam.scale<.6?'\n电脑':' · 电脑')+boost:(cam.scale<.6?'\n会议':' · 会议')):'')+tired;
   const tw=Math.max(44,w.tag.width),th=Math.max(14,w.tag.height);w.badgeBg.clear().roundRect(-tw/2-8,-2,tw+16,th+4,9).fill({color:0x2e231b,alpha:.84}).stroke({color:boost?0xe2be78:0xb89664,width:1,alpha:.78});
  }
  tick(0);
 }
 function tick(ms:number){if(!latest)return;const still=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='still'||Number.isFinite(fixed);const cam=officeCamera(app.screen.width,app.screen.height,layout?'overview':zone,layoutFocus);
  const outside:string[]=[];for(const w of walkers.values()){if(!w.root.visible)continue;const dx=w.tx-w.x,dy=w.ty-w.y,d=Math.hypot(dx,dy),step=Math.min(d,ms*.35);if(still){w.x=w.tx;w.y=w.ty;w.arrived=1;}else if(d>1){w.x+=dx/d*step;w.y+=dy/d*step;}else w.arrived=Math.min(1,w.arrived+ms/400);
   w.height=characterHeight(w.id,w.y);w.root.position.set(w.x,w.y);w.root.zIndex=w.y;const sit=w.zone==='work'?-48*w.arrived:0,deskSeated=w.zone==='work'&&w.arrived>.6;w.root.hitArea=actorHitArea(deskSeated);w.shadow.visible=!deskSeated;if(w.paper){w.paper.root.scale.set(w.height/w.paper.character.visibleHeight);w.paper.root.y=sit;for(const leg of ['leg-left','leg-right']){const n=w.paper.nodes.get(leg);if(n)n.visible=!deskSeated;}w.paper.apply(activityPose(w.paper.character,Number.isFinite(fixed)?fixed:elapsed,w.activity,!still&&d>2,reactionFor(latest,w.id),still));}
   if(actorOutsideFrame(w.x,w.y,w.height+(deskSeated?48:0),cam.scale,cam,app.screen.width,app.screen.height))outside.push(w.id);
   const tagOffset=w.zone==='work'?workLabelOffset:16;w.badge.position.set(cam.x+w.x*cam.scale,Math.min(cam.clip.y+cam.clip.height-w.badge.height-4,cam.y+(w.y+tagOffset)*cam.scale+(w.zone==='meeting'&&cam.scale<.8&&latest.office?.reservations[w.id]?.seat===1?22:0)));if(!outside.includes(w.id))w.badge.x=Math.max(cam.clip.x+w.badge.width/2,Math.min(cam.clip.x+cam.clip.width-w.badge.width/2,w.badge.x));w.badge.visible=!layout&&w.root.visible&&w.root.renderable&&w.badge.x-w.badge.width/2>=cam.clip.x&&w.badge.x+w.badge.width/2<=cam.clip.x+cam.clip.width;
  }
  const faces=[...walkers.values()].filter(w=>w.root.visible&&w.root.renderable).flatMap(w=>{const face=w.paper?.nodes.get('face');if(!face)return [];const b=face.getBounds();return [{x:b.x,y:b.y,width:b.width,height:b.height}];});
  for(const row of separateOfficeLabels([...walkers.values()].filter(w=>w.badge.visible).map(w=>({id:w.id,x:w.badge.x,y:w.badge.y-2,width:w.badge.width,height:w.badge.height})),app.screen.width,app.screen.height,faces)){const w=walkers.get(row.id)!;w.badge.position.set(row.x,row.y+2);}
  const presence=outside.join('|');if(presence!==lastPresence){lastPresence=presence;onPresence?.(outside);}
 }
 app.ticker.add(t=>{if(dead||document.hidden)return;const current=`${app.screen.width}/${app.screen.height}/${host.closest('[data-mode="layout"]')!==null}`;if(current!==size){size=current;sync();}elapsed+=Math.min(t.deltaMS,50)/1000;tick(Math.min(t.deltaMS,50));});
 return {update(view:GameView,locale:'zh'|'en'='zh',previewFocus:OfficeFocus=null,cameraZone:CameraZone='overview'){layoutFocus=previewFocus;zone=cameraZone;latest=view;english=locale==='en';sync();},destroy(){dead=true;background.destroy();app.destroy(true,{children:true});}};
}
