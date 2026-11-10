// Harness-only DOM diagnostic of the live Pixi scene, not a second renderer.
const rect=o=>{const b=o.getBounds();return {x:b.x,y:b.y,width:b.width,height:b.height};};
const intersection=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
export function installAudit({app,host,world,labels,objects,walkers,getState}){
 const output=document.createElement('script');output.type='application/json';output.id='b1-render-audit';document.body.append(output);
 const pixels=new WeakMap();let previous='';
 const alpha=(sprite,x,y)=>{const source=sprite.texture.source.resource;if(!pixels.has(source)){const c=document.createElement('canvas');c.width=source.width;c.height=source.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);pixels.set(source,{width:c.width,height:c.height,data:ctx.getImageData(0,0,c.width,c.height).data});}const p=pixels.get(source),local=sprite.worldTransform.applyInverse({x,y}),ix=Math.floor(local.x/sprite.texture.width*p.width),iy=Math.floor(local.y/sprite.texture.height*p.height);return ix>=0&&iy>=0&&ix<p.width&&iy<p.height?p.data[(iy*p.width+ix)*4+3]:0;};
 const capture=()=>{
  const {view,zone,layoutFocus,layout}=getState();if(!view)return;
  app.renderer.render(app.stage);
  // Pixi sets this to lastObjectRendered on its first DOM pointer event.
  app.renderer.events.rootBoundary.rootTarget=app.stage;
  const signature=JSON.stringify([app.screen.width,app.screen.height,zone,layoutFocus,layout,view.office?.revision,[...walkers.values()].map(w=>[w.id,w.x,w.y,!!w.paper]),[...objects.values()].map(o=>[o.kind,o.front.children.length,o.back.children.length])]);if(signature===previous)return;previous=signature;
  const identify=node=>{for(let n=node;n;n=n.parent){for(const w of walkers.values())if(n===w.root)return 'actor:'+w.id;for(const [id,o]of objects)if(n===o.front||n===o.back)return 'furniture:'+id;}return null;};
  const hit=(x,y)=>identify(app.renderer.events.rootBoundary.hitTest(x,y));
  const screen=(x,y)=>({x:world.x+x*world.scale.x,y:world.y+y*world.scale.y});
  const rasterInfo=s=>{if(!s)return null;alpha(s,0,0);const p=pixels.get(s.texture.source.resource);let minX=p.width,minY=p.height,maxX=-1,maxY=-1,count=0;for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(p.data[(y*p.width+x)*4+3]>=128){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);count++;}return{width:p.width,height:p.height,opaquePixels:count,bbox:{x:minX-140,y:minY-200,width:maxX-minX+1,height:maxY-minY+1},pixelBBox:count?{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1}:null,worldBBox:count?{x:minX*280/p.width-140,y:minY*240/p.height-200,width:(maxX-minX+1)*280/p.width,height:(maxY-minY+1)*240/p.height}:null};};
  const furniture=[...objects].map(([id,o])=>({id,kind:o.kind,anchor:{x:o.front.x,y:o.front.y},back:rect(o.back),front:rect(o.front),raster:{back:rasterInfo(o.back.children[0]),front:rasterInfo(o.front.children[0])},z:[o.back.zIndex,o.front.zIndex],loaded:!!o.front.children.length&&!!o.back.children.length}));
  const actors=[...walkers.values()].filter(w=>w.root.visible).map(w=>{
   const face=w.paper?.nodes.get('face'),f=face?rect(face):null,body=w.paper?.nodes.get('body'),badge=rect(w.badge),reservation=view.office?.reservations[w.id],item=view.office?.items.find(i=>i.id===reservation?.item),member=view.jobs.flatMap(j=>j.team).find(m=>m.character===w.id);
   const frontOverlap=f?furniture.filter(o=>o.z[1]>w.root.zIndex).reduce((sum,o)=>sum+intersection(f,o.front),0):null;
   const center=f?{x:f.x+f.width/2,y:f.y+f.height/2}:screen(w.x,w.y-150),torso=screen(w.x,w.y-(w.zone==='work'?110:70));
   let facePixels=0,coveredPixels=0,inViewportPixels=0;const faceSprite=face?.children.find(n=>n.texture),occluders=[...objects.values()].filter(o=>o.front.zIndex>w.root.zIndex).flatMap(o=>o.front.children).filter(n=>n.texture);
   if(f&&faceSprite)for(let y=Math.floor(f.y);y<f.y+f.height;y++)for(let x=Math.floor(f.x);x<f.x+f.width;x++){if(alpha(faceSprite,x+.5,y+.5)<128)continue;facePixels++;if(x>=0&&y>=0&&x<app.screen.width&&y<app.screen.height)inViewportPixels++;if(occluders.some(s=>alpha(s,x+.5,y+.5)>=128))coveredPixels++;}
   return{id:w.id,world:{x:w.x,y:w.y},height:w.height,renderedHeight:w.height*world.scale.y,seated:w.zone==='work',role:member?.role??'idle',slot:item?.slot??null,face:f,body:body?rect(body):null,badge,badgeVisible:w.badge.visible,z:w.root.zIndex,frontAabbOverlap:frontOverlap,facePixels,coveredPixels,inViewportPixels,faceUnoccludedRate:facePixels?1-coveredPixels/facePixels:null,faceHit:{...center,actual:hit(center.x,center.y)},bodyHit:{...torso,actual:hit(torso.x,torso.y)},ready:!!w.paper};
  });
  const furnitureHits=furniture.filter(o=>['basic','standard'].includes(o.kind)).map(o=>({id:o.id,kind:o.kind,slot:view.office.items.find(i=>i.id===o.id)?.slot,probes:[['desk',-65,-70],['monitor',80,-108],['transparent-top',0,-190],['transparent-corner',118,12],['chair-gap',0,-145]].map(([name,x,y])=>{const p=screen(o.anchor.x+x,o.anchor.y+y);return{name,local:[x,y],screen:p,actual:hit(p.x,p.y)};})}));
  for(const a of actors){a.badgeOverlap=actors.filter(b=>b.id!==a.id&&b.badgeVisible&&a.badgeVisible).reduce((sum,b)=>sum+intersection(a.badge,b.badge),0);a.badgeUnoccludedRate=a.badgeVisible?Math.max(0,1-a.badgeOverlap/(a.badge.width*a.badge.height)):null;}
  // Locator force-clicks these pointer-events:none 2px markers. The real DOM pointer
  // lands on the underlying production canvas, not on a synthetic event dispatcher.
  document.querySelectorAll('[data-b1-marker]').forEach(e=>e.remove());
  const mark=(id,p)=>{if(p.x<1||p.y<1||p.x>=app.screen.width-1||p.y>=app.screen.height-1)return;const e=document.createElement('i');e.id=id;e.dataset.b1Marker='true';e.setAttribute('aria-hidden','true');Object.assign(e.style,{position:'fixed',left:(p.x-1)+'px',top:(p.y-1)+'px',width:'2px',height:'2px',pointerEvents:'none'});document.body.append(e);};
  for(const a of actors){mark('b1-face-'+a.id,a.faceHit);mark('b1-body-'+a.id,a.bodyHit);}for(const f of furnitureHits)for(const p of f.probes)mark('b1-'+p.name+'-'+f.id,p.screen);
  const data={at:new Date().toISOString(),scenario:new URLSearchParams(location.search).get('office-lab'),viewport:[app.screen.width,app.screen.height,devicePixelRatio],zone,layoutFocus,layout,world:{x:world.x,y:world.y,scale:world.scale.x},background:{size:host.style.backgroundSize,position:host.style.backgroundPosition},actors,furniture,furnitureHits,ready:actors.every(a=>a.ready)&&furniture.every(o=>o.loaded),labelsAboveWorld:app.stage.children.indexOf(labels)>app.stage.children.indexOf(world)};
  output.textContent=JSON.stringify(data);output.dataset.ready=String(data.ready);output.dataset.zone=zone;output.dataset.camera=layoutFocus?'locate':zone;output.dataset.layout=String(layout);
 };
 const interval=setInterval(capture,120);window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
}
