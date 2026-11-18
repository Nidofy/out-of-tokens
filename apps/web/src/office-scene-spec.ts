import type {GameView} from 'oot-platform';
import {activityFor} from './scene-layout.js';
export type OfficeFocus={x:number;y:number}|null;
export const workLabelOffset=-32;
/** Ignore SVG padding and low-alpha floor shadows; both layers use the shared (0,0) anchor. */
export function workFurnitureHitArea(rgba:ArrayLike<number>,width=280,height=240){
 const mask=new Uint8Array(width*height);
 for(let i=0;i<mask.length;i++)mask[i]=rgba[i*4+3]!>=96?1:0;
 return {contains(x:number,y:number){const px=Math.floor((x+140)*width/280),py=Math.floor((y+200)*height/240);return px>=0&&py>=0&&px<width&&py<height&&mask[py*width+px]===1;}};
}
/** Resolve small same-row label collisions without shrinking the 12px text. */
export function separateOfficeLabels(rows:{id:string;x:number;y:number;width:number;height:number}[],viewportWidth:number,viewportHeight=Infinity,faces:{x:number;y:number;width:number;height:number}[]=[]){
 const placed:typeof rows=[];
 for(const row of [...rows].sort((a,b)=>a.y-b.y||a.x-b.x)){
  const next={...row};for(const previous of placed){if(Math.min(next.y+next.height,previous.y+previous.height)<=Math.max(next.y,previous.y))continue;const left=next.x-next.width/2,right=previous.x+previous.width/2;if(left<right+3&&next.x+next.width/2>previous.x-previous.width/2)next.x=right+3+next.width/2;}
  next.x=Math.min(viewportWidth-next.width/2,next.x);
  const overlaps=(a:typeof row,b:typeof row)=>Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y)&&Math.min(a.x+a.width/2,b.x+b.width/2)>Math.max(a.x-a.width/2,b.x-b.width/2);
  if(Math.abs(next.x-row.x)>40||placed.some(p=>overlaps(next,p))){
   next.x=Math.max(row.width/2,Math.min(viewportWidth-row.width/2,row.x));next.y=row.y;
   for(let n=0;n<=placed.length;n++){const hits=placed.filter(p=>overlaps(next,p));if(!hits.length)break;next.y=Math.max(...hits.map(p=>p.y+p.height))+3;}
   if(next.y+next.height>viewportHeight){next.y=row.y;for(let n=0;n<=placed.length;n++){const hits=placed.filter(p=>overlaps(next,p));if(!hits.length)break;next.y=Math.min(...hits.map(p=>p.y))-next.height-3;}}
  }
  const blocks=faces.map((f,i)=>({id:`face-${i}`,x:f.x+f.width/2,y:f.y,width:f.width,height:f.height}));
  if(blocks.some(f=>overlaps(next,f))){
   const candidates=[...blocks,...placed].flatMap(b=>[
    {...next,x:b.x-b.width/2-next.width/2-3},{...next,x:b.x+b.width/2+next.width/2+3},
    {...next,y:b.y-next.height-3},{...next,y:b.y+b.height+3}
   ]).sort((a,b)=>Math.hypot(a.x-row.x,a.y-row.y)-Math.hypot(b.x-row.x,b.y-row.y));
   const free=candidates.find(p=>p.x-p.width/2>=0&&p.x+p.width/2<=viewportWidth&&p.y>=0&&p.y+p.height<=viewportHeight&&![...blocks,...placed].some(b=>overlaps(p,b)));
   if(free)Object.assign(next,free);
  }
  placed.push(next);
 }
 return placed;
}
export type CameraZone='overview'|'work-left'|'work-right'|'meeting'|'lounge';
export type CameraPan={x:number;y:number};
export const defaultCameraPan:CameraPan={x:0,y:0};
export const zoneNames:Record<CameraZone,[string,string]>={overview:['全景','Overview'],'work-left':['工作区Ⅰ','Work I'],'work-right':['工作区Ⅱ','Work II'],meeting:['会议区','Meeting'],lounge:['休闲区','Lounge']};
export function clampZoom(zoom:number){return Math.round(Math.max(1,Math.min(1.5,Number.isFinite(zoom)?zoom:1))*100)/100;}
export function slotPoint(slot:string,chapter=0){const n=Number(slot.split('-')[1])-1;
 if(slot.startsWith('work')){const row=Math.floor(n/4),col=n%4;return {x:640+col*260+(row%2)*36,y:chapter===0?795:620+row*130};}
 if(slot.startsWith('meeting'))return chapter===0?{x:920+n*350,y:635}:{x:180+n*240,y:580};
 if(slot.startsWith('server'))return {x:1740,y:635+n*200};
 return {x:215+n%2*245,y:(chapter===0?635:780)+Math.floor(n/2)*180};
}
export function officeCamera(width:number,height:number,zone:CameraZone,focus:OfficeFocus=null,zoom=1,pan:CameraPan=defaultCameraPan){
 // AI Village contract: overlays never reserve world space or move the camera.
 // Cover the entire viewport with the same transform for background and entities.
 const centers={overview:[960,540],'work-left':[770,730],'work-right':[1350,730],meeting:[1090,590],lounge:[330,700]} as const;
 const z=clampZoom(zoom),base=focus?1.6:zone==='overview'||width<900?1:1.25;
 const scale=Math.max(width/1920,height/1080)*base*z,[cx,cy]=focus?[focus.x,focus.y]:centers[zone];
 const clamp=(n:number,min:number)=>Math.max(min,Math.min(0,n));
 const baseX=clamp(width/2-cx*scale,width-1920*scale),baseY=zone==='overview'&&!focus&&z===1?height-1080*scale:clamp(height/2-cy*scale,height-1080*scale);
 const px=Number.isFinite(pan?.x)?pan.x:0,py=Number.isFinite(pan?.y)?pan.y:0;
 return {scale,x:clamp(baseX+px,width-1920*scale),y:clamp(baseY+py,height-1080*scale),clip:{x:0,y:0,width,height}};
}
export function clampOfficePan(width:number,height:number,zone:CameraZone,focus:OfficeFocus,zoom:number,pan:CameraPan):CameraPan{
 const zero=officeCamera(width,height,zone,focus,zoom,defaultCameraPan),clamped=officeCamera(width,height,zone,focus,zoom,pan);
 return {x:clamped.x-zero.x,y:clamped.y-zero.y};
}
export function zoomOfficeCamera(width:number,height:number,zone:CameraZone,focus:OfficeFocus,zoom:number,pan:CameraPan,nextZoom:number,point={x:width/2,y:height/2}):{zoom:number;pan:CameraPan}{
 const z=clampZoom(nextZoom),old=officeCamera(width,height,zone,focus,zoom,pan),zero=officeCamera(width,height,zone,focus,z,defaultCameraPan);
 const wx=(point.x-old.x)/old.scale,wy=(point.y-old.y)/old.scale;
 return {zoom:z,pan:clampOfficePan(width,height,zone,focus,z,{x:point.x-wx*zero.scale-zero.x,y:point.y-wy*zero.scale-zero.y})};
}
export function idlePoint(index:number,count=4){
 if(count<=4){const pts=[{x:335,y:655},{x:490,y:655},{x:215,y:900},{x:430,y:900}] as const;return pts[index%4]!;}
 // Aisles around the furniture, rather than a grid running through desks/whiteboards.
 const pts=[{x:500,y:600},{x:1280,y:600},{x:1530,y:600},{x:1770,y:600},
  {x:170,y:835},{x:400,y:835},{x:1500,y:835},{x:1770,y:835},
  {x:570,y:955},{x:810,y:955},{x:1050,y:955},{x:1290,y:955}];
 return pts[index%pts.length]!;
}
/** Keep idle faces out of newly occupied meeting/lounge furniture without moving slot anchors. */
export function clearIdleFurniture(point:{x:number;y:number},furniture:{kind:string;x:number;y:number}[],others:{x:number;y:number}[]){
 const p={...point},half=(kind:string)=>(({basic:140,standard:140,whiteboard:112,coffee:82,sofa:120,server:62} as Record<string,number>)[kind]??82),top=(kind:string)=>(({basic:200,standard:200,whiteboard:176,coffee:158.4,sofa:138,server:182} as Record<string,number>)[kind]??158.4);
 // Use the painted top, not the transparent 200-unit texture padding.
 const blocks=(q:typeof p,f:typeof furniture[number])=>q.y<f.y&&q.y>f.y-top(f.kind)&&Math.abs(q.x-f.x)<half(f.kind)+80;
 for(const f of furniture){if(!blocks(p,f))continue;
  const candidates=[{x:f.x-half(f.kind)-80,y:p.y},{x:f.x+half(f.kind)+80,y:p.y}].sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x));
  const free=candidates.find(q=>q.x>=170&&q.x<=1770&&!furniture.some(f=>blocks(q,f))&&!others.some(o=>Math.abs(o.x-q.x)<120&&Math.abs(o.y-q.y)<100));
  if(free)p.x=free.x;else{
   // A forward fallback also needs an aisle: do not stack a body over the next row.
   const front=[p.x,...others.flatMap(o=>[o.x-128,o.x+128])].map(x=>({x,y:f.y+100})).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x));
   const gap=front.find(q=>q.x>=170&&q.x<=1770&&!furniture.some(f=>blocks(q,f))&&!others.some(o=>Math.abs(o.x-q.x)<96&&Math.abs(o.y-q.y)<160));
   if(gap)Object.assign(p,gap);else p.y=f.y+100;
  }
 }
 return p;
}
/** Shared render anchors: locating and presence use exactly the renderer's placement. */
export function actorPlacements(view:GameView){
 const scene=view.campaign?.scene??'workshop',chapter=view.campaign?.chapter??0;
 const members=view.actors.filter(a=>a.location===scene);let idle=0;
 const placements=members.map(a=>{
  const reservation=view.office?.reservations[a.id],item=reservation&&view.office?.items.find(i=>i.id===reservation.item),activity=activityFor(view,a.id);
  const seated=!!(scene==='workshop'&&item?.slot&&['work','review','think'].includes(activity));
  // Public rows leave a full body and label gap; the left aisle clears the desktop dock.
  const p=seated?slotPoint(item!.slot!,chapter):scene==='workshop'?idlePoint(idle++,members.length):{x:540+(idle%6)*230,y:750+Math.floor(idle++/6)*220};
  return {id:a.id,x:p.x+(seated&&reservation?.zone==='meeting'?(reservation.seat===0?-72:72):0),y:p.y,activity,seated,zone:seated?reservation!.zone:'lounge'};
 });
 if(scene==='workshop'){
  const furniture=(view.office?.items??[]).filter(i=>i.slot&&(['whiteboard','coffee','sofa','server'].includes(i.kind)||(chapter>0&&['basic','standard'].includes(i.kind)))).map(i=>({kind:i.kind,...slotPoint(i.slot!,chapter)}));
  for(const p of placements.filter(p=>!p.seated))Object.assign(p,clearIdleFurniture(p,furniture,placements.filter(o=>o!==p)));
 }
 return placements;
}
export function actorFocus(view:GameView,id:string):OfficeFocus{
 if(view.campaign?.scene!=='workshop')return null;
 const p=actorPlacements(view).find(p=>p.id===id);return p?{x:p.x,y:p.y-110}:null;
}
export function jobFocus(view:GameView,id:string):OfficeFocus{
 if(view.campaign?.scene!=='workshop')return null;
 const r=Object.values(view.office?.reservations??{}).find(r=>r.job===id),item=r&&view.office?.items.find(i=>i.id===r.item);
 if(!item?.slot)return null;const p=slotPoint(item.slot,view.campaign.chapter);return {x:p.x,y:p.y-110};
}
export function actorOutsideFrame(x:number,y:number,height:number,scale:number,offset:{x:number;y:number},width:number,viewportHeight:number){
 const cx=offset.x+x*scale,foot=offset.y+y*scale;
 return cx-48*scale<0||cx+48*scale>width||foot-height*scale<0||foot+26>viewportHeight;
}

export type WorkstationStage='idle'|'approach'|'seat'|'work'|'stand'|'depart';
export type WorkstationMotionState={stage:WorkstationStage;station:{x:number;y:number}|null;x:number;y:number;bx:number;by:number;tx:number;ty:number;zone:string;activity:string;arrived:number};
export type WorkstationStepResult={sit:number;zIndex:number;deskSeated:boolean;scaleY:number;walking:boolean;tagOffset:number};

const WORK_SIDE_GAP_OFFSET=124;
const WORK_FRONT_AISLE_OFFSET=22;
const WORK_CHAIR_BACK_OFFSET=46;
const WORK_SEAT_OFFSET=48;
const WORK_SEAT_MS=260;

function sameStation(a:{x:number;y:number}|null,placement:{x:number;y:number;zone:string}){
 return !!a&&placement.zone==='work'&&a.x===placement.x&&a.y===placement.y;
}
function aisleZIndex(y:number,deskRows:readonly number[]){
 for(const rowY of deskRows)if(Math.abs(y-rowY)<=14)return Math.max(y,rowY+4);
 return y;
}
function stepPoint(x:number,y:number,tx:number,ty:number,maxStep:number){
 const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy);
 if(d<=maxStep||d<=0.001)return {x:tx,y:ty,moved:d>0.5,done:true};
 return {x:x+dx/d*maxStep,y:y+dy/d*maxStep,moved:true,done:false};
}

export function syncWorkstationTarget(state:WorkstationMotionState,placement:{x:number;y:number;zone:string;activity:string},still:boolean){
 state.activity=placement.activity;
 if(still){
  state.bx=placement.x;state.by=placement.y;state.tx=placement.x;state.ty=placement.y;
  state.x=placement.x;state.y=placement.y;state.zone=placement.zone;state.arrived=1;
  state.station=placement.zone==='work'?{x:placement.x,y:placement.y}:null;
  state.stage=placement.zone==='work'?'work':'idle';
  return;
 }
 if(state.station&&sameStation(state.station,placement)){
  state.bx=placement.x;state.by=placement.y;state.tx=placement.x;state.ty=placement.y;state.zone=placement.zone;
  if(state.stage==='stand')state.stage='seat';
  else if(state.stage==='depart')state.stage='approach';
  return;
 }
 if(state.station&&(state.stage==='seat'||state.stage==='work'||(state.stage==='approach'&&Math.abs(state.x-state.station.x)<110&&state.y<=state.station.y))){
  state.bx=placement.x;state.by=placement.y;state.tx=placement.x;state.ty=placement.y;state.zone=placement.zone;
  state.stage=state.stage==='approach'?'depart':'stand';
  return;
 }
 if(placement.zone==='work'){
  state.station={x:placement.x,y:placement.y};
  state.bx=placement.x;state.by=placement.y;state.tx=placement.x;state.ty=placement.y;state.zone='work';
  state.arrived=0;state.stage='approach';
  return;
 }
 if(state.bx!==placement.x||state.by!==placement.y){state.arrived=0;state.bx=placement.x;state.by=placement.y;}
 if(state.stage!=='depart'){state.station=null;state.stage='idle';state.tx=state.bx;state.ty=state.by;}
 else{state.tx=state.bx;state.ty=state.by;}
 state.zone=placement.zone;
}

export function stepWorkstationTrajectory(state:WorkstationMotionState,ms:number,still:boolean,deskRows:readonly number[]=[]):WorkstationStepResult{
 if(still){
  state.x=state.tx;state.y=state.ty;state.arrived=1;
  state.station=state.zone==='work'?{x:state.bx,y:state.by}:null;
  state.stage=state.zone==='work'?'work':'idle';
  return {
   sit:state.zone==='work'?-WORK_SEAT_OFFSET:0,
   zIndex:state.y,
   deskSeated:state.zone==='work',
   scaleY:state.y,
   walking:false,
   tagOffset:state.zone==='work'?workLabelOffset:16
  };
 }
 const speed=ms*(state.stage==='idle'&&state.zone==='lounge'&&state.arrived>=1?.09:.35);
 if(state.stage==='stand'&&state.station){
  const sy=state.station.y;
  state.x=state.station.x;state.y=sy;
  state.arrived=Math.max(0,state.arrived-ms/WORK_SEAT_MS);
  const sit=-WORK_CHAIR_BACK_OFFSET-(WORK_SEAT_OFFSET-WORK_CHAIR_BACK_OFFSET)*state.arrived;
  const deskSeated=state.arrived>.6;
  const scaleY=sy-WORK_CHAIR_BACK_OFFSET*(1-state.arrived);
  if(state.arrived<=0){
   state.stage='depart';state.y=sy-WORK_CHAIR_BACK_OFFSET;
   return {sit:0,zIndex:sy,deskSeated:false,scaleY:sy-WORK_CHAIR_BACK_OFFSET,walking:false,tagOffset:16};
  }
  return {sit,zIndex:sy,deskSeated,scaleY,walking:false,tagOffset:workLabelOffset};
 }
 if(state.stage==='depart'&&state.station){
  const sx=state.station.x,sy=state.station.y,entryX=sx-WORK_SIDE_GAP_OFFSET,frontY=sy+WORK_FRONT_AISLE_OFFSET,backY=sy-WORK_CHAIR_BACK_OFFSET;
  let walking=false,zIndex=state.y;
  if(Math.abs(state.x-entryX)>1.5&&state.y<=backY+4){
   const s=stepPoint(state.x,state.y,entryX,backY,speed);
   state.x=s.x;state.y=s.y;walking=s.moved;
   zIndex=Math.abs(state.x-sx)<104?sy:aisleZIndex(state.y,deskRows);
  }else{
   const s=stepPoint(state.x,state.y,entryX,frontY,speed);
   state.x=s.x;state.y=s.y;walking=s.moved;
   zIndex=state.y>sy-2?Math.max(state.y,sy+4):state.y;
   if(s.done){
    if(state.zone==='work'){state.station={x:state.bx,y:state.by};state.stage='approach';state.arrived=0;}
    else{state.station=null;state.stage='idle';state.arrived=0;}
   }
  }
  return {sit:0,zIndex,deskSeated:false,scaleY:state.y,walking,tagOffset:16};
 }
 if(state.stage==='approach'&&state.station){
  const sx=state.station.x,sy=state.station.y,entryX=sx-WORK_SIDE_GAP_OFFSET,frontY=sy+WORK_FRONT_AISLE_OFFSET,backY=sy-WORK_CHAIR_BACK_OFFSET;
  let walking=false,zIndex=aisleZIndex(state.y,deskRows);
  const behindCorridor=Math.abs(state.y-backY)<=1.5&&state.x>=entryX-2&&state.x<=sx+2;
  if(!behindCorridor&&Math.abs(state.x-entryX)>2){
   const wpY=state.y>backY?frontY:backY;
   const s=stepPoint(state.x,state.y,entryX,wpY,speed);
   state.x=s.x;state.y=s.y;walking=s.moved;
   zIndex=aisleZIndex(state.y,deskRows);
  }else if(!behindCorridor){
   const s=stepPoint(state.x,state.y,entryX,backY,speed);
   state.x=s.x;state.y=s.y;walking=s.moved;
   zIndex=state.y>sy-2?Math.max(state.y,sy+4):state.y;
  }else{
   const s=stepPoint(state.x,state.y,sx,backY,speed);
   state.x=s.x;state.y=s.y;walking=s.moved;
   zIndex=Math.abs(state.x-sx)<104?sy:state.y;
   if(s.done){
    state.x=sx;state.y=sy;state.stage='seat';state.arrived=0;
    return {sit:-WORK_CHAIR_BACK_OFFSET,zIndex:sy,deskSeated:false,scaleY:backY,walking:false,tagOffset:workLabelOffset};
   }
  }
  return {sit:0,zIndex,deskSeated:false,scaleY:state.y,walking,tagOffset:16};
 }
 if((state.stage==='seat'||state.stage==='work')&&state.station){
  const sy=state.station.y;
  state.x=state.station.x;state.y=sy;
  if(state.stage==='seat'){
   state.arrived=Math.min(1,state.arrived+ms/WORK_SEAT_MS);
   if(state.arrived>=1)state.stage='work';
  }else state.arrived=1;
  const sit=-WORK_CHAIR_BACK_OFFSET-(WORK_SEAT_OFFSET-WORK_CHAIR_BACK_OFFSET)*state.arrived;
  const deskSeated=state.arrived>.6;
  const scaleY=sy-WORK_CHAIR_BACK_OFFSET*(1-state.arrived);
  return {sit,zIndex:sy,deskSeated,scaleY,walking:false,tagOffset:workLabelOffset};
 }
 const dx=state.tx-state.x,dy=state.ty-state.y,d=Math.hypot(dx,dy);
 if(d>1){
  const s=stepPoint(state.x,state.y,state.tx,state.ty,speed);
  state.x=s.x;state.y=s.y;
 }else state.arrived=Math.min(1,state.arrived+ms/400);
 return {sit:0,zIndex:aisleZIndex(state.y,deskRows),deskSeated:false,scaleY:state.y,walking:d>2,tagOffset:16};
}
