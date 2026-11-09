/** World-local interactive geometry, independent of the 280×240 texture canvas. */
export function furnitureHitArea(kind:string,layer:'front'|'back'){
 const work=kind==='basic'||kind==='standard';
 const table=work||kind==='dining'||kind==='reading';
 const boxes=table?(layer==='back'?(work?[[-38,-168,76,148]]:[]):[
  [-120,-88,240,106],
  ...(work?[[42,-126,80,50]]:[]),
 ]):(layer==='front'?[]:kind==='whiteboard'?[[-112,-176,224,126]]:kind==='coffee'?[[-82,-158,164,172]]:kind==='server'?[[-56,-182,118,202]]:[[-120,-138,240,152]]);
 return {contains(x:number,y:number){return boxes.some(([bx,by,w,h])=>x>=bx!&&x<=bx!+w!&&y>=by!&&y<=by!+h!);}};
}
