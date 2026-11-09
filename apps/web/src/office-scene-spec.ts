export type OfficeFocus={x:number;y:number}|null;
export type CameraZone='overview'|'work-left'|'work-right'|'meeting'|'lounge';
export const zoneNames:Record<CameraZone,[string,string]>={overview:['全景','Overview'],'work-left':['工作区Ⅰ','Work I'],'work-right':['工作区Ⅱ','Work II'],meeting:['会议区','Meeting'],lounge:['休闲区','Lounge']};
export function slotPoint(slot:string,chapter=0){const n=Number(slot.split('-')[1])-1;
 if(slot.startsWith('work'))return {x:660+n%4*300,y:chapter===0?900:760+Math.floor(n/4)*80};
 if(slot.startsWith('meeting'))return {x:950+n*380,y:650};
 if(slot.startsWith('server'))return {x:1750,y:660+n*230};
 return {x:240+n%2*260,y:650+Math.floor(n/2)*230};
}
export function officeCamera(width:number,height:number,zone:CameraZone,focus:OfficeFocus=null){
 // AI Village contract: overlays never reserve world space or move the camera.
 // Cover the entire viewport with the same transform for background and entities.
 const centers={overview:[960,540],'work-left':[810,730],'work-right':[1410,730],meeting:[1090,590],lounge:[330,700]} as const;
 const scale=Math.max(width/1920,height/1080)*(focus?1.6:zone==='overview'||width<900?1:1.25),[cx,cy]=focus?[focus.x,focus.y]:centers[zone];
 const clamp=(n:number,min:number)=>Math.max(min,Math.min(0,n));
 return {scale,x:clamp(width/2-cx*scale,width-1920*scale),y:zone==='overview'&&!focus?height-1080*scale:clamp(height/2-cy*scale,height-1080*scale),clip:{x:0,y:0,width,height}};
}
export function idlePoint(index:number,count=4){return count<=4?{x:190+(index%2)*270,y:710+Math.floor(index/2)*220}:{x:180+(index%4)*460,y:650+Math.floor(index/4)*160};}
