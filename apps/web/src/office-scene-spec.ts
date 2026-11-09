export type CameraZone='overview'|'work-left'|'work-right'|'meeting'|'lounge';
export const zoneNames:Record<CameraZone,[string,string]>={overview:['全景','Overview'],'work-left':['工作区Ⅰ','Work I'],'work-right':['工作区Ⅱ','Work II'],meeting:['会议区','Meeting'],lounge:['休闲区','Lounge']};
export function slotPoint(slot:string,chapter=0){const n=Number(slot.split('-')[1])-1;
 if(slot.startsWith('work'))return {x:660+n%4*300,y:chapter===0?900:760+Math.floor(n/4)*80};
 if(slot.startsWith('meeting'))return {x:950+n*380,y:650};
 if(slot.startsWith('server'))return {x:1750,y:660+n*230};
 return {x:240+n%2*260,y:650+Math.floor(n/2)*230};
}
export function officeCamera(width:number,height:number,zone:CameraZone,layout=false){
 const compact=width<1000,top=layout?145:compact?300:255,bottom=height-(layout?180:180),left=16,right=width-(compact||layout?16:340);
 const boxes={overview:[70,430,1790,650],'work-left':[490,665,640,405],'work-right':[1090,665,660,405],meeting:[680,410,920,400],lounge:[60,460,610,620]} as const;
 const [bx,by,bw,bh]=boxes[zone],scale=Math.max(.15,Math.min((right-left)/bw,Math.max(120,bottom-top)/bh));
 return {scale,x:left+(right-left-bw*scale)/2-bx*scale,y:top+(bottom-top-bh*scale)/2-by*scale,clip:{x:left,y:top,width:right-left,height:Math.max(120,bottom-top)}};
}
export function idlePoint(index:number,count=4){return count<=4?{x:190+(index%2)*270,y:760+Math.floor(index/2)*240}:{x:180+(index%4)*460,y:680+Math.floor(index/4)*170};}
