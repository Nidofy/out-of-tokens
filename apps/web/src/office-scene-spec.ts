export type OfficeFocus={x:number;y:number}|null;
export type CameraZone='overview'|'work-left'|'work-right'|'meeting'|'lounge';
export const zoneNames:Record<CameraZone,[string,string]>={overview:['全景','Overview'],'work-left':['工作区Ⅰ','Work I'],'work-right':['工作区Ⅱ','Work II'],meeting:['会议区','Meeting'],lounge:['休闲区','Lounge']};
export function slotPoint(slot:string,chapter=0){const n=Number(slot.split('-')[1])-1;
 if(slot.startsWith('work')){const row=Math.floor(n/4),col=n%4;return {x:640+col*260+(row%2)*36,y:chapter===0?795:620+row*130};}
 if(slot.startsWith('meeting'))return chapter===0?{x:920+n*350,y:635}:{x:180+n*240,y:580};
 if(slot.startsWith('server'))return {x:1740,y:635+n*200};
 return {x:215+n%2*245,y:(chapter===0?635:780)+Math.floor(n/2)*180};
}
export function officeCamera(width:number,height:number,zone:CameraZone,focus:OfficeFocus=null){
 // AI Village contract: overlays never reserve world space or move the camera.
 // Cover the entire viewport with the same transform for background and entities.
 const centers={overview:[960,540],'work-left':[770,730],'work-right':[1350,730],meeting:[1090,590],lounge:[330,700]} as const;
 const scale=Math.max(width/1920,height/1080)*(focus?1.6:zone==='overview'||width<900?1:1.25),[cx,cy]=focus?[focus.x,focus.y]:centers[zone];
 const clamp=(n:number,min:number)=>Math.max(min,Math.min(0,n));
 return {scale,x:clamp(width/2-cx*scale,width-1920*scale),y:zone==='overview'&&!focus?height-1080*scale:clamp(height/2-cy*scale,height-1080*scale),clip:{x:0,y:0,width,height}};
}
export function idlePoint(index:number,count=4){
 if(count<=4){const pts=[{x:165,y:650},{x:375,y:650},{x:215,y:900},{x:430,y:900}] as const;return pts[index%4]!;}
 // Aisles around the furniture, rather than a grid running through desks/whiteboards.
 const pts=[{x:500,y:600},{x:1280,y:600},{x:1530,y:600},{x:1770,y:600},
  {x:170,y:850},{x:400,y:850},{x:1500,y:850},{x:1770,y:850},
  {x:570,y:1020},{x:810,y:1020},{x:1050,y:1020},{x:1290,y:1020}];
 return pts[index%pts.length]!;
}
