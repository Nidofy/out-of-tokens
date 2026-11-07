import {PaperDoll} from './art/paper-doll.js';
import {Application,Container,Graphics,Text,Rectangle} from 'pixi.js';
import 'pixi.js/unsafe-eval';
import type {GameView} from 'oot-platform';
import {names} from './presentation.js';
import {sceneArt} from './studio-ui.js';
import {loadVillageCharacter,villagePose} from './village-characters.js';
import type {VillageRig} from './village-characters.js';
function box(p:Container,x:number,y:number,w:number,h:number,c:number,r=5){const g=new Graphics().roundRect(x,y,w,h,r).fill(c);p.addChild(g);return g;}
function label(p:Container,text:string,x:number,y:number,size=12,color=0x344b42){const t=new Text({text,style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:size,fill:color,fontWeight:'500'}});t.anchor.set(.5,0);t.position.set(x,y);p.addChild(t);return t;}
export async function createWorkshop(host:HTMLElement,onSelect:(id:string)=>void){
 const app=new Application();await app.init({resizeTo:host,backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,preference:'webgl'});app.canvas.setAttribute('aria-hidden','true');host.appendChild(app.canvas);
 const world=new Container();app.stage.addChild(world);let dead=false,latest:GameView|undefined,language:'zh'|'en'='zh',elapsed=0,lastSize='';
 const rigs=new Map<string,VillageRig>(),requested=new Set<string>(),failed=new Set<string>();
 function request(id:string){if(requested.has(id))return;requested.add(id);void loadVillageCharacter(id).then(rig=>{if(!dead){rigs.set(id,rig);draw();}}).catch(()=>{if(!dead){failed.add(id);draw();}});}
 let animated:{paper:PaperDoll;base:number;working:boolean;scene:string;busy:boolean;mood:number;prop:Container;celebrate:boolean;panic:boolean;rest:boolean}[]=[];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 function draw(){if(!latest||dead)return;const view=latest;for(const child of world.removeChildren())child.destroy({children:true});animated=[];
  const scene=view.campaign?.scene??'workshop',chapter=view.campaign?.chapter??0;
  host.style.backgroundImage=`url("${sceneArt(scene,chapter)}")`;host.style.backgroundSize='cover';host.style.backgroundPosition='center';
  const w=app.screen.width,h=app.screen.height,compact=w<650,members=view.actors.filter(a=>a.location===scene),cols=compact?(members.length>6?4:3):6,rows=Math.max(1,Math.ceil(members.length/cols));
  const tile=Math.min(compact?126:180,(w-40)/Math.min(cols,Math.max(1,members.length))),top=Math.max(compact?235:260,h*(compact?.42:.40)),unit=Math.max(60,(h-(compact?210:170)-top)/rows),height=Math.min(compact?106:150,unit/1.5);
  const startX=(w-tile*Math.min(cols,members.length))/2+tile/2,firstY=rows===1?h*.69:top+height,step=unit;
  members.forEach((a,i)=>{const x=startX+i%cols*tile,y=firstY+Math.floor(i/cols)*step,scale=height/150,working=(view.absoluteSlot%4<2||view.overtime.includes(a.id))&&view.jobs.some(j=>j.status==='working'&&j.team.some(m=>m.character===a.id)),personalBusy=a.busyUntil>view.absoluteSlot,celebrate=view.ledger.at(-1)?.reason.startsWith('delivery:')===true&&view.ledger.at(-1)?.slot===view.absoluteSlot,panic=!!view.pending,rest=view.absoluteSlot%4===3&&!working&&!personalBusy;
   const station=new Container();station.position.set(x,y);station.scale.set(scale);world.addChild(station);
   station.addChild(new Graphics().ellipse(0,10,63,13).fill({color:0x304339,alpha:.15}));
   // Back of chair, actor, foreground table: shared anchor keeps legs behind furniture.
   box(station,-27,-58,54,38,0x718c82,12);
   const rig=rigs.get(a.id);let paper:PaperDoll|undefined;
   if(rig){paper=new PaperDoll(rig.character,rig.textures);paper.root.pivot.set(...rig.character.feet);paper.root.scale.set(150/rig.character.visibleHeight);paper.root.y=6;station.addChild(paper.root);paper.apply(villagePose(rig.character,0,0,'neutral'));}
   else{request(a.id);label(station,language==='zh'?(failed.has(a.id)?'立绘未载入':'加载伙伴…'):(failed.has(a.id)?'Art unavailable':'Loading…'),0,-100,11);}
   const initial=view.catalog?.versions.find(v=>v.character===a.id)?.id;if(a.version!==initial)label(station,a.version.split('.').slice(1).join('.').toUpperCase(),0,80,9,0x527b70);
   box(station,-66,-25,132,12,0xb79168,5);box(station,-61,-13,7,42,0x816b59,2);box(station,54,-13,7,42,0x816b59,2);
   const prop=new Container();station.addChild(prop);
   if(scene==='workshop'){box(prop,-28,-64,56,38,0x465d5b,5);box(prop,-24,-60,48,29,working?0xb2d3cb:0xd6e0d3,2);box(prop,-4,-26,8,6,0x465d5b,1);box(prop,-20,-20,40,4,0xede7d5,2);const code=new Graphics().moveTo(-18,-52).lineTo(8,-52).moveTo(-18,-46).lineTo(16,-46).moveTo(-18,-40).lineTo(-1,-40).stroke({color:0x5e8b7d,width:2});prop.addChild(code);box(prop,43,-39,13,15,0xf2eee2,3);}
   else if(scene==='canteen'){prop.addChild(new Graphics().ellipse(0,-28,31,9).fill(0xf7eedc).ellipse(0,-34,23,9).fill(0xfffcf0).roundRect(-24,-34,48,13,8).fill(0x94b3a2));prop.addChild(new Graphics().ellipse(0,-35,19,7).fill(0xffffff));box(prop,40,-46,14,22,0xe8c78e,4);}
   else{prop.addChild(new Graphics().poly([-37,-44,-3,-39,0,-20,-37,-25]).fill(0xf8f0d9).poly([0,-39,36,-44,37,-25,0,-20]).fill(0xfff9e8).moveTo(0,-39).lineTo(0,-20).stroke({color:0xa89272,width:1.5}));box(prop,47,-50,6,25,0x7d9382,2);prop.addChild(new Graphics().ellipse(50,-51,13,6).fill(0x8cad96));}
   const chip=box(station,-61,36,122,23,0xfff9ee,11);chip.alpha=.95;label(station,names[a.id]??a.id,0,39,12);
   const status=language==='zh'?(panic?'需要决策':celebrate?'交付完成':rest?'休息中':working?'工作中':personalBusy?scene==='library'?'学习中':scene==='canteen'?'用餐中':'忙碌中':a.mood<30?'需要休息':'可以安排'):(panic?'Decision needed':celebrate?'Delivered':rest?'Resting':working?'Working':personalBusy?'Busy':a.mood<30?'Needs rest':'Available');
   label(station,status,0,64,10,0x405f53);
   if(working||a.mood<30){const bubble=box(station,32,-147,44,25,0xfffbef,10);bubble.alpha=.96;label(station,working?'···':'☾',54,-148,18);}
   station.eventMode='static';station.cursor='pointer';station.hitArea=new Rectangle(-66,-145,132,222);station.on('pointertap',()=>onSelect(a.id));
   if(paper)animated.push({paper,prop,base:i*.8,working,scene,busy:personalBusy,celebrate,panic,rest,mood:a.mood});
  });
  if(!members.length)label(world,language==='zh'?'伙伴们在别处，打开「伙伴」看看他们的去向。':'Teammates are elsewhere. Open Team to find them.',w/2,h*.65,compact?11:15);
 }
 function update(view:GameView,locale:'zh'|'en'='zh'){latest=view;language=locale;draw();}
 app.ticker.add(t=>{if(dead)return;const size=`${app.screen.width}/${app.screen.height}`;if(size!==lastSize){lastSize=size;draw();}if(document.hidden)return;elapsed+=Math.min(50,t.deltaMS)/1000;const still=reduce.matches||document.documentElement.dataset.motion==='still';for(const a of animated){const pulse=still?0:Math.sin(elapsed*(a.working?5:1.7)+a.base);a.paper.apply(villagePose(a.paper.character,(!still&&a.celebrate?-Math.abs(pulse)*5:pulse*(a.working?.65:1.1))*6,still?0:a.panic?pulse*1.5:a.rest?3:a.mood<30?2:a.busy&&(a.scene==='canteen'||a.scene==='library')?pulse:0,a.panic?'surprised':a.celebrate?'happy':a.rest||a.mood<30?'sleepy':'neutral'));a.prop.y=!still&&a.busy&&a.scene==='canteen'?pulse:0;}});
 return{update,destroy(){dead=true;app.destroy(true,{children:true});}};
}
