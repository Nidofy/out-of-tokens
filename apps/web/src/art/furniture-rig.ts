import {Assets,Container,Graphics,Sprite,Texture} from 'pixi.js';
import type {GameView} from 'oot-platform';
import {decorPropArt,decorPropIds,furnitureKinds,furnitureLayerArt,furniturePreviewArt} from '../furniture-art.js';
import type {ChibiFxId} from './chibi-types.js';
import type {LoadedChibiFxBundle} from './chibi-loader.js';
import {slotPoint} from '../office-scene-spec.js';

export type FurnitureLayer='back'|'front';
export type FurnitureKind=(typeof furnitureKinds)[number];
export type DecorPropId=(typeof decorPropIds)[number];

export interface FurnitureFxAnchors {
 screenRect?:readonly [number,number,number,number]; // [x,y,w,h] in 560x480 canvas
 steamAnchor?:readonly [number,number]; // [x,y] in 560x480 canvas
 ledPoints?:readonly (readonly [number,number])[]; // [x,y] list in 560x480 canvas
 seatY?:number;
}

export interface DecorPlacement {
 id:DecorPropId;
 x:number;
 y:number;
 displayHeight:number;
 fxId:ChibiFxId;
 foley:'emote'|'flip'|'coin'|'message';
}

export const DAY_FURNITURE_TINT=0xffffff;
export const NIGHT_FURNITURE_TINT=0xdccab8;

/** Anchors synced with apps/web/public/art/furniture/catalog.json (560x480 -> 2px per world unit, origin (280,400)). */
export const FURNITURE_FX_ANCHORS:Readonly<Record<FurnitureKind,FurnitureFxAnchors>>={
 basic:{screenRect:[377,175,118,54],seatY:280},
 standard:{screenRect:[380,169,116,56],seatY:265},
 whiteboard:{},
 coffee:{steamAnchor:[231,209]},
 sofa:{seatY:319},
 server:{
  ledPoints:[
   [343,113],[343,149],[343,184],[343,219],
   [343,254],[343,289],[343,324],[343,359]
  ]
 },
 dining:{},
 reading:{}
};

/** Presentation-only corner placements in workshop; never overlap officeSlots or simulation state. */
export const WORKSHOP_DECOR_PLACEMENTS:readonly DecorPlacement[]=[
 {id:'decor-studio_cat',x:126,y:956,displayHeight:72,fxId:'emote-heart',foley:'emote'},
 {id:'decor-monstera_pot',x:1572,y:626,displayHeight:104,fxId:'prop-heal_leaf',foley:'flip'},
 {id:'decor-token_jar',x:1742,y:948,displayHeight:84,fxId:'emote-spark',foley:'coin'},
 {id:'decor-vinyl_player',x:1630,y:956,displayHeight:94,fxId:'emote-slack',foley:'message'}
];

export function canvasToFurnitureWorld(px:number,py:number):{x:number;y:number}{
 return {x:px/2-140,y:py/2-200};
}

/**
 * Legacy SVG fallback toggle for furniture (Decision: keep legacy apps/web/public/art/office/*.svg short-term).
 * Supports URL (?furniture=legacy / ?furniture=0), document dataset (data-furniture="legacy"),
 * and localStorage ('oot-furniture-legacy' === '1').
 */
export function isLegacyFurnitureFallbackActive():boolean{
 if(typeof window==='undefined')return false;
 try{
  const sp=new URLSearchParams(window.location.search);
  const param=sp.get('furniture');
  if(param==='0'||param==='legacy'||param==='off')return true;
  if(param==='1'||param==='on')return false;
 }catch{
  // Ignore URL parsing errors in restricted environments.
 }
 if(typeof document!=='undefined'&&document.documentElement.dataset.furniture==='legacy')return true;
 try{
  return window.localStorage.getItem('oot-furniture-legacy')==='1';
 }catch{
  return false;
 }
}

export function resolveFurnitureLayerUrl(kind:string,layer:FurnitureLayer):{url:string;isLegacy:boolean}|null{
 if(isLegacyFurnitureFallbackActive()){
  return {url:`./art/office/${kind}-${layer}.svg`,isLegacy:true};
 }
 const modern=furnitureLayerArt(kind,layer);
 if(modern)return {url:modern,isLegacy:false};
 // Known furniture kind with intentionally empty layer (e.g. sofa-front) skips loading cleanly.
 if((furnitureKinds as readonly string[]).includes(kind))return null;
 return {url:`./art/office/${kind}-${layer}.svg`,isLegacy:true};
}

export function resolveFurniturePreviewUrl(kind:string):string{
 if(isLegacyFurnitureFallbackActive())return `./art/office/${kind}-front.svg`;
 return furniturePreviewArt(kind);
}

export function furnitureTintFor(night:boolean):number{
 return night?NIGHT_FURNITURE_TINT:DAY_FURNITURE_TINT;
}

export type ServerLoadLevel='calm'|'busy'|'hot';

export function resolveServerLoadLevel(view:GameView,anyOverloaded:boolean):ServerLoadLevel{
 if(anyOverloaded)return 'hot';
 const activeWorking=view.jobs.filter(j=>j.status==='working').length;
 if(activeWorking>=2||view.possibleStops.length>0)return 'hot';
 if(activeWorking>=1)return 'busy';
 return 'calm';
}

export function warmModernFurnitureAssets(view:GameView):void{
 const scene=view.campaign?.scene??'workshop';
 const legacy=isLegacyFurnitureFallbackActive();
 const items=scene==='workshop'?(view.office?.items??[]):[{id:'public-table',kind:scene==='canteen'?'dining':'reading',slot:'meeting-1'}];
 const seen=new Set<string>();
 for(const i of items){
  if(!i.slot)continue;
  for(const layer of ['back','front'] as const){
   const resolved=resolveFurnitureLayerUrl(i.kind,layer);
   if(resolved&&!seen.has(resolved.url)){
    seen.add(resolved.url);
    void Assets.load<Texture>(resolved.url).catch(()=>{});
   }
  }
 }
 if(!legacy&&scene==='workshop'){
  for(const d of WORKSHOP_DECOR_PLACEMENTS){
   void Assets.load<Texture>(decorPropArt(d.id)).catch(()=>{});
  }
 }
}

/**
 * Pure dynamic FX overlay mounted on each furniture object (screen glow, server LEDs, coffee steam, chair bounce).
 * Zero impact on layout hit-areas or simulation state.
 */
export class FurnitureDynamicFx {
 readonly backFx=new Container();
 readonly frontFx=new Container();
 private readonly screenGlow=new Graphics();
 private readonly ledGraphics=new Graphics();
 private readonly steamPuffs:Graphics[]=[];
 private sitBounce=0;
 private wasOccupied=false;

 constructor(readonly kind:string){
  this.backFx.eventMode='none';
  this.frontFx.eventMode='none';
  this.screenGlow.visible=false;
  this.frontFx.addChild(this.screenGlow);

  this.ledGraphics.visible=false;
  this.backFx.addChild(this.ledGraphics);

  if(kind==='coffee'){
   for(let i=0;i<3;i++){
    const g=new Graphics()
     .circle(0,0,4.2)
     .fill({color:0xfff7ea,alpha:0.48})
     .circle(3,-3,2.8)
     .fill({color:0xfffaf2,alpha:0.35});
    g.visible=false;
    this.backFx.addChild(g);
    this.steamPuffs.push(g);
   }
  }
 }

 update(params:{
  elapsed:number;
  dtMs:number;
  occupied:boolean;
  overloaded:boolean;
  coffeeActive:boolean;
  serverLoad:ServerLoadLevel;
  night:boolean;
  still:boolean;
  backSprite?:Sprite|undefined;
 }):void{
  const {elapsed,dtMs,occupied,overloaded,coffeeActive,serverLoad,night,still,backSprite}=params;
  const dtSec=Math.max(0,dtMs)/1000;
  const anchors=FURNITURE_FX_ANCHORS[this.kind as FurnitureKind];

  // 1. Workstation chair sit recoil & monitor glow
  if(this.kind==='basic'||this.kind==='standard'){
   if(occupied&&!this.wasOccupied&&!still)this.sitBounce=1;
   this.wasOccupied=occupied;
   if(this.sitBounce>0&&!still){
    this.sitBounce=Math.max(0,this.sitBounce-dtSec*4.2);
   }else if(still){
    this.sitBounce=0;
   }
   if(backSprite){
    const offset=Math.sin(this.sitBounce*Math.PI)*2.2;
    backSprite.position.set(-140,-200-offset);
   }
   const rect=anchors?.screenRect;
   if(rect&&occupied){
    const topLeft=canvasToFurnitureWorld(rect[0],rect[1]);
    const w=rect[2]/2,h=rect[3]/2;
    const pulse=still?0.5:(0.5+0.5*Math.sin(elapsed*(overloaded?6.2:2.6)));
    const color=overloaded?0xffa95c:this.kind==='standard'?0x9ef0d8:0x86e8c4;
    const alpha=(night?0.24:0.16)+pulse*(overloaded?0.18:0.09);
    this.screenGlow.visible=true;
    this.screenGlow
     .clear()
     .roundRect(topLeft.x+2,topLeft.y+2,w-4,h-4,4)
     .fill({color,alpha})
     .roundRect(topLeft.x-3,topLeft.y-3,w+6,h+6,7)
     .fill({color,alpha:alpha*0.35});
   }else{
    this.screenGlow.visible=false;
   }
  }

  // 2. Server compute LED indicators
  if(this.kind==='server'&&anchors?.ledPoints){
   this.ledGraphics.visible=true;
   this.ledGraphics.clear();
   anchors.ledPoints.forEach((pt,idx)=>{
    const worldPt=canvasToFurnitureWorld(pt[0],pt[1]);
    const phase=still?0.6:(0.5+0.5*Math.sin(elapsed*(serverLoad==='hot'?6.8:serverLoad==='busy'?3.2:1.5)+idx*0.95));
    const isWarn=serverLoad==='hot'&&idx<3;
    const color=isWarn?0xffa24c:serverLoad==='busy'?0x7ae8d4:0x80d89e;
    const alpha=(night?0.55:0.42)+phase*0.45;
    this.ledGraphics
     .circle(worldPt.x,worldPt.y,2.2)
     .fill({color,alpha})
     .circle(worldPt.x,worldPt.y,4.2)
     .fill({color,alpha:alpha*0.28});
   });
  }

  // 3. Coffee machine gentle steam wisps
  if(this.kind==='coffee'&&anchors?.steamAnchor){
   const origin=canvasToFurnitureWorld(anchors.steamAnchor[0],anchors.steamAnchor[1]);
   const show=!still&&(coffeeActive||!night);
   const baseAlpha=coffeeActive?0.62:0.28;
   this.steamPuffs.forEach((g,idx)=>{
    if(!show){g.visible=false;return;}
    const cycle=(elapsed*(coffeeActive?0.68:0.38)+idx/3)%1;
    g.visible=true;
    g.position.set(origin.x+Math.sin(cycle*Math.PI*2+idx)*4.5,origin.y-6-cycle*(coffeeActive?28:18));
    const s=0.65+cycle*0.6;
    g.scale.set(s);
    g.alpha=Math.sin(cycle*Math.PI)*baseAlpha;
   });
  }
 }
}

/**
 * Clickable presentation-only studio decor prop with soft bounce, breathing (for studio cat),
 * and shared chibi FX popup on tap.
 */
export class ClickableDecorProp {
 readonly root=new Container();
 private readonly shadow=new Graphics();
 private readonly body=new Sprite();
 private readonly fxSprite=new Sprite();
 private popTimer=0;
 private readonly popDuration=0.95;

 constructor(
  readonly spec:DecorPlacement,
  texture:Texture,
  private readonly fxBundle:LoadedChibiFxBundle|undefined,
  onTap:(spec:DecorPlacement)=>boolean
 ){
  this.root.position.set(spec.x,spec.y);
  this.root.zIndex=spec.y;
  this.root.eventMode='static';
  this.root.cursor='pointer';

  this.shadow
   .ellipse(2,3,spec.displayHeight*0.42,8)
   .fill({color:0x3b2a1d,alpha:0.15});

  this.body.texture=texture;
  this.body.pivot.set(128,236);
  const scale=spec.displayHeight/198;
  this.body.scale.set(scale);

  this.fxSprite.anchor.set(0.5);
  this.fxSprite.visible=false;

  this.root.addChild(this.shadow,this.body,this.fxSprite);
  const halfW=Math.max(30,spec.displayHeight*0.46);
  this.root.hitArea={
   contains(px:number,py:number){
    return px>=-halfW&&px<=halfW&&py>=-spec.displayHeight-6&&py<=10;
   }
  };
  this.root.on('pointertap',()=>{
   if(onTap(spec))this.trigger();
  });
 }

 trigger():void{
  this.popTimer=this.popDuration;
 }

 update(elapsed:number,dtMs:number,night:boolean,layout:boolean,still:boolean):void{
  const dtSec=Math.max(0,dtMs)/1000;
  this.root.alpha=layout?0.25:1;
  this.root.eventMode=layout?'none':'static';
  this.body.tint=furnitureTintFor(night);

  const baseScale=this.spec.displayHeight/198;
  let sx=baseScale;
  let sy=baseScale;
  let rot=0;
  let offsetY=0;

  if(!still&&this.spec.id==='decor-studio_cat'){
   const breath=Math.sin(elapsed*1.45);
   sx=baseScale*(1-breath*0.015);
   sy=baseScale*(1+breath*0.02);
  }

  if(this.popTimer>0&&!still){
   this.popTimer=Math.max(0,this.popTimer-dtSec);
   const p=1-this.popTimer/this.popDuration;
   if(p<0.42){
    const t=p/0.42;
    const bounce=Math.sin(t*Math.PI);
    const damped=Math.sin(t*Math.PI*2)*(1-t);
    sx=baseScale*(1+damped*0.08);
    sy=baseScale*(1-damped*0.08);
    offsetY=-bounce*6;
    rot=this.spec.id==='decor-monstera_pot'||this.spec.id==='decor-token_jar'?Math.sin(t*Math.PI*3)*0.07*(1-t):0;
   }
   const fxTex=this.fxBundle?.textures.get(this.spec.fxId);
   if(fxTex){
    this.fxSprite.texture=fxTex;
    this.fxSprite.visible=true;
    const fxScale=32/Math.max(1,fxTex.width);
    this.fxSprite.position.set(0,-this.spec.displayHeight-8-p*26);
    this.fxSprite.scale.set(fxScale*(0.85+Math.sin(Math.min(1,p*2)*Math.PI)*0.22));
    this.fxSprite.alpha=p<0.75?0.95:(1-p)/0.25;
   }else{
    this.fxSprite.visible=false;
   }
  }else{
   this.popTimer=0;
   this.fxSprite.visible=false;
  }

  this.body.position.set(0,offsetY);
  this.body.scale.set(sx,sy);
  this.body.rotation=rot;
 }

 destroy():void{
  this.root.destroy({children:true});
 }
}

/** Verify helper for tests: check whether decor placement is safely clear of standard office slot centers. */
export function decorClearsSlots(decor:DecorPlacement,slots:readonly string[],chapter:number):boolean{
 for(const slot of slots){
  const p=slotPoint(slot,chapter);
  if(Math.hypot(decor.x-p.x,decor.y-p.y)<86)return false;
 }
 return true;
}
