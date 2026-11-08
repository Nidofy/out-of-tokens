import {stationLayout,activityFor,reactionFor} from './scene-layout.js';
import {scenePageSize,sceneSpec} from './scene-spec.js';
import {PaperDoll} from './art/paper-doll.js';
import {Application,Container,Graphics,Text,Rectangle} from 'pixi.js';
import 'pixi.js/unsafe-eval';
import type {GameView} from 'oot-platform';
import {names} from './presentation.js';
import {sceneArt} from './studio-ui.js';
import {loadVillageCharacter,villagePose,activityPose} from './village-characters.js';
import type {VillageRig} from './village-characters.js';
function box(p:Container,x:number,y:number,w:number,h:number,c:number,r=5){const g=new Graphics().roundRect(x,y,w,h,r).fill(c);p.addChild(g);return g;}
function label(p:Container,text:string,x:number,y:number,size=12,color=0x493a30){const t=new Text({text,style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:size,fill:color,fontWeight:'500'}});t.anchor.set(.5,0);t.position.set(x,y);p.addChild(t);return t;}
export async function createWorkshop(host:HTMLElement,onSelect:(id:string)=>void){
 const app=new Application();await app.init({resizeTo:host,backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,preference:'webgl'});app.canvas.setAttribute('aria-hidden','true');host.appendChild(app.canvas);
 let page=0;
 const pager=document.createElement('div');pager.className='scene-pager';
 const previous=document.createElement('button'),next=document.createElement('button'),pageText=document.createElement('span');
 previous.textContent='‹';next.textContent='›';previous.setAttribute('aria-label','上一组伙伴 / Previous teammates');next.setAttribute('aria-label','下一组伙伴 / Next teammates');
 pager.append(previous,pageText,next);host.appendChild(pager);previous.onclick=()=>{page=Math.max(0,page-1);draw();};next.onclick=()=>{page++;draw();};
 const world=new Container();app.stage.addChild(world);let dead=false,latest:GameView|undefined,language:'zh'|'en'='zh',elapsed=0,lastSize='';
 const rigs=new Map<string,VillageRig>(),requested=new Set<string>(),failed=new Set<string>();
 function request(id:string){if(requested.has(id))return;requested.add(id);void loadVillageCharacter(id).then(rig=>{if(!dead){rigs.set(id,rig);draw();}}).catch(()=>{if(!dead){failed.add(id);draw();}});}
 const walkers=new Map<string,{paper:PaperDoll;x:number;y:number;scene:string}>();
 let animated:{id:string;layer:Container;x:number;y:number;scale:number;paper:PaperDoll;activity:string;base:number;working:boolean;scene:string;busy:boolean;mood:number;tag:Container;prop:Container;celebrate:boolean;panic:boolean;rest:boolean}[]=[];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 function draw(){if(!latest||dead)return;const view=latest;for(const w of walkers.values())w.paper.root.removeFromParent();for(const child of world.removeChildren())child.destroy({children:true});animated=[];
  const scene=view.campaign?.scene??'workshop',chapter=view.campaign?.chapter??0;
  host.style.backgroundImage=`url("${sceneArt(scene,chapter)}")`;host.style.backgroundSize='cover';host.style.backgroundPosition='center';
  const w=app.screen.width,h=app.screen.height,compact=w<650,all=view.actors.filter(a=>a.location===scene),size=scenePageSize(w),pages=Math.max(1,Math.ceil(all.length/size));
  page=Math.min(page,pages-1);previous.disabled=page===0;next.disabled=page===pages-1;pager.hidden=pages===1;pageText.textContent=language==='zh'?'伙伴 '+(page+1)+' / '+pages:'Team '+(page+1)+' / '+pages;
  const members=all.slice(page*size,(page+1)*size),anchors=stationLayout(w,h,members.length);
  members.forEach((a,i)=>{const {x,y,scale}=anchors[i]!,activity=activityFor(view,a.id),working=activity==='work'||activity==='review',personalBusy=a.busyUntil>view.absoluteSlot,reaction=reactionFor(view,a.id),celebrate=reaction==='happy',panic=reaction==='surprised',rest=activity==='rest';
   const station=new Container();station.position.set(x,y);station.scale.set(scale);world.addChild(station);

   // Back of chair, actor, foreground table: shared anchor keeps legs behind furniture.
   if(working||personalBusy)box(station,-27,-58,54,38,0x9e836b,12);
   const layer=new Container();station.addChild(layer);layer.addChild(new Graphics().ellipse(0,10,55,11).fill({color:0x304339,alpha:.15}));
   const rig=rigs.get(a.id);let paper:PaperDoll|undefined;
   if(rig){let walker=walkers.get(a.id);if(!walker){walker={paper:new PaperDoll(rig.character,rig.textures),x:40,y:h*.7,scene};walkers.set(a.id,walker);}if(walker.scene!==scene){walker.x=40;walker.y=h*.7;walker.scene=scene;}paper=walker.paper;paper.root.pivot.set(...rig.character.feet);paper.root.scale.set(150/rig.character.visibleHeight);paper.root.y=sceneSpec.contacts.feet.y;layer.addChild(paper.root);paper.apply(villagePose(rig.character,0,0,'neutral'));}
   else{request(a.id);label(station,language==='zh'?(failed.has(a.id)?'立绘未载入':'加载伙伴…'):(failed.has(a.id)?'Art unavailable':'Loading…'),0,-100,11);}
   const initial=view.catalog?.versions.find(v=>v.character===a.id)?.id;
   const furniture=new Container();station.addChild(furniture);furniture.visible=working||personalBusy;box(furniture,-66,-25,132,12,0xb79168,5);box(furniture,-61,-13,7,42,0x816b59,2);box(furniture,54,-13,7,42,0x816b59,2);
   const prop=new Container();furniture.addChild(prop);
   const office=view.campaign?.hardware.office??0,compute=view.campaign?.hardware.compute??0;
   if(scene==='workshop'&&office>=1){box(furniture,-66,-25,132,5,0xd2bda0,2);box(furniture,-45,-8,90,7,0x7e7069,2);}
   if(scene==='workshop'&&office>=3){box(prop,-61,-60,29,32,0x60534c,3);box(prop,-58,-57,23,25,0xc7d7d4,2);}
   if(scene==='workshop'&&compute>0){box(furniture,48,-5,20,30,0x514e5a,3);for(let k=0;k<Math.min(5,compute);k++)box(furniture,52,1+k*5,4,2,0xd7c390,1);}
   if(view.absoluteSlot%4>=2){station.addChildAt(new Graphics().ellipse(0,-60,65,50).fill({color:0xffd58d,alpha:.10}),0);}
   if(scene==='workshop'){box(prop,-28,-64,56,38,0x465d5b,5);box(prop,-24,-60,48,29,working?0xf0cc8e:0xd6e0d3,2);box(prop,-4,-26,8,6,0x465d5b,1);box(prop,-20,-20,40,4,0xede7d5,2);const code=new Graphics().moveTo(-18,-52).lineTo(8,-52).moveTo(-18,-46).lineTo(16,-46).moveTo(-18,-40).lineTo(-1,-40).stroke({color:0x98663d,width:2});prop.addChild(code);box(prop,43,-39,13,15,0xf2eee2,3);}
   else if(scene==='canteen'){prop.addChild(new Graphics().ellipse(0,-28,31,9).fill(0xf7eedc).ellipse(0,-34,23,9).fill(0xfffcf0).roundRect(-24,-34,48,13,8).fill(0x94b3a2));prop.addChild(new Graphics().ellipse(0,-35,19,7).fill(0xffffff));box(prop,40,-46,14,22,0xe8c78e,4);}
   else{prop.addChild(new Graphics().poly([-37,-44,-3,-39,0,-20,-37,-25]).fill(0xf8f0d9).poly([0,-39,36,-44,37,-25,0,-20]).fill(0xfff9e8).moveTo(0,-39).lineTo(0,-20).stroke({color:0xa89272,width:1.5}));box(prop,47,-50,6,25,0x7d9382,2);prop.addChild(new Graphics().ellipse(50,-51,13,6).fill(0x8cad96));}
   const tag=new Container();tag.scale.set(1/scale);layer.addChild(tag);tag.y=36;const chip=box(tag,-61,0,122,23,0xfff9ee,11);chip.alpha=.95;label(tag,(names[a.id]??a.id)+(a.version!==initial?' · '+a.version.split('.').slice(1).join('.').toUpperCase():''),0,3,12);
   const status=language==='zh'?(panic?'需要决策':celebrate?'交付完成':rest?'休息中':working?(activity==='review'?'审查中':'工作中'):personalBusy?scene==='library'?'学习中':scene==='canteen'?'用餐中':'忙碌中':a.mood<30?'需要休息':'可以安排'):(panic?'Decision needed':celebrate?'Delivered':rest?'Resting':working?(activity==='review'?'Reviewing':'Working'):personalBusy?'Busy':a.mood<30?'Needs rest':'Available');
   label(tag,status,0,25,12,0x493a30);
   if(working||a.mood<30){const bubble=box(layer,32,-147,44,25,0xfffbef,10);bubble.alpha=.96;label(layer,working?'···':'☾',54,-148,18);}
   layer.eventMode='static';layer.cursor='pointer';layer.hitArea=new Rectangle(-66,-145,132,222);layer.on('pointertap',()=>onSelect(a.id));
   if(paper)animated.push({id:a.id,layer,x,y,scale,paper,tag,prop,activity,base:i*.8,working,scene,busy:personalBusy,celebrate,panic,rest,mood:a.mood});
  });
  if(!members.length)label(world,language==='zh'?'伙伴们在别处，打开「伙伴」看看他们的去向。':'Teammates are elsewhere. Open Team to find them.',w/2,h*.65,compact?11:15);
 }
 function update(view:GameView,locale:'zh'|'en'='zh'){latest=view;language=locale;for(const id of failed)requested.delete(id);failed.clear();draw();}
 app.ticker.add(t=>{if(dead)return;const size=`${app.screen.width}/${app.screen.height}`;if(size!==lastSize){lastSize=size;draw();}if(document.hidden)return;elapsed+=Math.min(50,t.deltaMS)/1000;const still=reduce.matches||document.documentElement.dataset.motion==='still';for(const a of animated){const walker=walkers.get(a.id)!;const idle=a.activity==='idle';const phase=Math.floor(elapsed/5+a.base)%3;const tx=a.x+(idle?[-24,28,0][phase]!*a.scale:0),ty=a.y+(idle?[10,-8,0][phase]!*a.scale:0);const dx=tx-walker.x,dy=ty-walker.y,dist=Math.hypot(dx,dy),step=Math.min(dist,Math.min(50,t.deltaMS)*.08);if(still){walker.x=tx;walker.y=ty;}else if(dist>1){walker.x+=dx/dist*step;walker.y+=dy/dist*step;}a.layer.position.set((walker.x-a.x)/a.scale,(walker.y-a.y)/a.scale);const walking=!still&&dist>2;const pulse=still?0:Math.sin(elapsed*(a.working?5:1.7)+a.base);a.paper.apply(activityPose(a.paper.character,elapsed+a.base,a.activity,walking,a.panic?'surprised':a.celebrate?'happy':a.mood<30?'sleepy':'neutral',still));a.prop.y=!still&&a.busy&&a.scene==='canteen'?pulse:0;}});
 return{update,destroy(){dead=true;pager.remove();for(const w of walkers.values()){w.paper.root.removeFromParent();w.paper.root.destroy({children:true});}walkers.clear();app.destroy(true,{children:true});}};
}
