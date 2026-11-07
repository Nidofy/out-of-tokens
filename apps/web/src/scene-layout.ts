import type {GameView} from 'oot-platform';
export function stationLayout(width:number,height:number,count:number){
 const compact=width<650,cols=Math.min(count,compact?(count>6?4:3):6),rows=Math.ceil(count/Math.max(1,cols));
 const top=Math.min(Math.max(compact?330:280,height*.42),height*.52),bottom=height-(compact?230:190);
 const cellWidth=(width-32)/Math.max(1,cols),cellHeight=Math.max(30,bottom-top)/Math.max(1,rows);
 const scale=Math.max(.1,Math.min(compact?.72:1,cellWidth/160,cellHeight/250));
 return Array.from({length:count},(_,i)=>({x:16+cellWidth*(i%cols+.5),y:top+cellHeight*(Math.floor(i/cols)+.64),scale}));
}
export function activityFor(view:GameView,id:string){
 const actor=view.actors.find(a=>a.id===id)!;
 const job=view.jobs.find(j=>j.status==='working'&&j.team.some(m=>m.character===id));
 if(job&&(view.absoluteSlot%4<2||view.overtime.includes(id)))return job.team.find(m=>m.character===id)!.role==='reviewer'?'review':'work';
 if(view.absoluteSlot%4===3&&actor.busyUntil<=view.absoluteSlot)return 'rest';
 if(actor.busyUntil>view.absoluteSlot)return actor.location==='canteen'?'meal':actor.location==='library'?'read':'think';
 return 'idle';
}
export function reactionFor(view:GameView,id:string){
 if(view.pending?.actors.includes(id))return 'surprised';
 const row=[...view.ledger].reverse().find(r=>r.reason.startsWith('delivery:')&&r.slot===view.absoluteSlot);
 if(row&&view.jobs.find(j=>j.id===row.reason.slice(9))?.team.some(m=>m.character===id))return 'happy';
 return 'neutral';
}
