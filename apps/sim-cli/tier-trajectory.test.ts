import {expect,test} from 'vitest';
import {stepWorkstationTrajectory,syncWorkstationTarget} from '../web/src/office-scene-spec.js';
import type {WorkstationMotionState} from '../web/src/office-scene-spec.js';

function makeWalker(x=215,y=900):WorkstationMotionState{
 return {stage:'idle',station:null,x,y,bx:x,by:y,tx:x,ty:y,zone:'lounge',activity:'idle',arrived:1};
}

test('full 5-stage workstation lifecycle preserves continuous feet, scaleY, and dynamic zIndex',()=>{
 for(const [sx,sy] of [[640,620],[900,795],[1160,880]] as const){
  const w=makeWalker(335,655);
  const deskRows=[620,750,795,880];
  syncWorkstationTarget(w,{x:sx,y:sy,zone:'work',activity:'work'},false);
  expect(w.stage).toBe('approach');
  expect(w.station).toEqual({x:sx,y:sy});

  const seenStages=new Set<string>([w.stage]);
  let prevWorldY=w.y,prevScaleY=w.y;
  let enteredBehindDesk=false;
  for(let i=0;i<250;i++){
   const beforeStage=w.stage;
   const step=stepWorkstationTrajectory(w,16,false,deskRows);
   seenStages.add(w.stage);
   const worldY=w.y+step.sit;
   if(beforeStage==='approach'&&w.stage==='seat'){
    expect(Math.abs(worldY-prevWorldY)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(step.scaleY-prevScaleY)).toBeLessThanOrEqual(0.01);
   }
   if(w.stage==='seat'||w.stage==='work'){
    expect(step.zIndex).toBeGreaterThan(sy-2);
    expect(step.zIndex).toBeLessThan(sy+2);
   }
   if(beforeStage==='approach'&&Math.abs(w.x-sx)<104&&w.y<sy){
    enteredBehindDesk=true;
    expect(step.zIndex).toBeGreaterThan(sy-2);
    expect(step.zIndex).toBeLessThan(sy+2);
   }
   if(w.stage==='work'){
    expect(step.sit).toBe(-48);
    expect(step.deskSeated).toBe(true);
    expect(step.scaleY).toBe(sy);
    break;
   }
   prevWorldY=worldY;
   prevScaleY=step.scaleY;
  }
  expect(w.stage).toBe('work');
  expect(enteredBehindDesk).toBe(true);
  expect(seenStages).toEqual(new Set(['approach','seat','work']));

  // Reassignment from work must transition through stand -> depart -> idle without snapping arrived=0 at (sx, sy).
  syncWorkstationTarget(w,{x:215,y:900,zone:'lounge',activity:'idle'},false);
  expect(w.stage).toBe('stand');
  expect(w.arrived).toBe(1);
  prevWorldY=sy-48;
  for(let i=0;i<250;i++){
   const beforeStage=w.stage;
   const step=stepWorkstationTrajectory(w,16,false,deskRows);
   seenStages.add(w.stage);
   const worldY=w.y+step.sit;
   if(beforeStage==='stand'&&w.stage==='depart'){
    expect(Math.abs(worldY-prevWorldY)).toBeLessThanOrEqual(1);
    expect(step.scaleY).toBe(sy-46);
   }
   if(beforeStage==='stand'){
    expect(step.zIndex).toBe(sy);
   }
   if(w.stage==='idle')break;
   prevWorldY=worldY;
  }
  expect(w.stage).toBe('idle');
  expect(seenStages).toEqual(new Set(['approach','seat','work','stand','depart','idle']));
 }
});

test('desk-to-desk transfer stands and departs old station before approaching new station',()=>{
 const w=makeWalker(640,620);
 w.stage='work';w.station={x:640,y:620};w.bx=640;w.by=620;w.tx=640;w.ty=620;w.zone='work';w.arrived=1;
 syncWorkstationTarget(w,{x:900,y:620,zone:'work',activity:'work'},false);
 expect(w.stage).toBe('stand');
 expect(w.station).toEqual({x:640,y:620});
 const stages:string[]=[];
 for(let i=0;i<400;i++){
  stepWorkstationTrajectory(w,16,false,[620,750,880]);
  if(stages[stages.length-1]!==w.stage)stages.push(w.stage);
  if(w.stage==='work'&&w.station?.x===900)break;
 }
 expect(stages).toEqual(['stand','depart','approach','seat','work']);
 expect(w.x).toBe(900);expect(w.y).toBe(620);
});

test('mid-stand or mid-depart reassignment to same station reverses cleanly',()=>{
 const w=makeWalker(900,795);
 w.stage='stand';w.station={x:900,y:795};w.arrived=0.5;w.zone='lounge';
 syncWorkstationTarget(w,{x:900,y:795,zone:'work',activity:'work'},false);
 expect(w.stage).toBe('seat');
 expect(w.arrived).toBe(0.5);

 w.stage='depart';w.station={x:900,y:795};w.x=830;w.y=795-46;w.zone='lounge';
 syncWorkstationTarget(w,{x:900,y:795,zone:'work',activity:'work'},false);
 expect(w.stage).toBe('approach');
 expect(w.station).toEqual({x:900,y:795});
});

test('horizontal aisle walk stays in front of desk front sprites (zIndex > rowY + 2)',()=>{
 const w=makeWalker(516,642);
 syncWorkstationTarget(w,{x:1420,y:620,zone:'work',activity:'work'},false);
 for(let i=0;i<30;i++){
  const step=stepWorkstationTrajectory(w,16,false,[620,750,880]);
  if(Math.abs(w.x-1420)>=104&&w.y>=618){
   expect(step.zIndex).toBeGreaterThan(622);
  }
 }
});

test('reduced-motion still mode snaps immediately to settled work and idle states',()=>{
 const w=makeWalker(100,980);
 syncWorkstationTarget(w,{x:640,y:620,zone:'work',activity:'work'},true);
 expect(w.stage).toBe('work');
 expect(w.x).toBe(640);expect(w.y).toBe(620);
 const s1=stepWorkstationTrajectory(w,16,true,[620]);
 expect(s1).toMatchObject({sit:-48,zIndex:620,deskSeated:true,scaleY:620,walking:false});

 syncWorkstationTarget(w,{x:335,y:655,zone:'lounge',activity:'idle'},true);
 expect(w.stage).toBe('idle');
 const s2=stepWorkstationTrajectory(w,16,true,[620]);
 expect(s2).toMatchObject({sit:0,zIndex:655,deskSeated:false,scaleY:655,walking:false});
});

test('VC-R1: repeated sync during stand or depart is idempotent with zero foot/scale jump',()=>{
 const deskRows=[620,750,795,880];
 for(const target of [{x:215,y:900,zone:'lounge',activity:'idle'},{x:900,y:795,zone:'work',activity:'work'}]){
  const w=makeWalker(640,795);
  w.stage='work';w.station={x:640,y:795};w.bx=640;w.by=795;w.tx=640;w.ty=795;w.zone='work';w.arrived=1;
  syncWorkstationTarget(w,target,false);
  const s1=stepWorkstationTrajectory(w,100,false,deskRows);
  const footBefore=w.y+s1.sit,scaleBefore=s1.scaleY,arrivedBefore=w.arrived;
  expect(w.stage).toBe('stand');

  for(let r=0;r<5;r++){
   syncWorkstationTarget(w,target,false);
   const s0=stepWorkstationTrajectory(w,0,false,deskRows);
   expect(w.stage).toBe('stand');
   expect(w.station).toEqual({x:640,y:795});
   expect(w.arrived).toBe(arrivedBefore);
   expect(w.y+s0.sit).toBe(footBefore);
   expect(s0.scaleY).toBe(scaleBefore);
  }

  while(w.stage==='stand')stepWorkstationTrajectory(w,16,false,deskRows);
  expect(w.stage).toBe('depart');
  const d1=stepWorkstationTrajectory(w,32,false,deskRows);
  const depFoot=w.y+d1.sit,depScale=d1.scaleY,depX=w.x,depY=w.y;
  for(let r=0;r<5;r++){
   syncWorkstationTarget(w,target,false);
   const s0=stepWorkstationTrajectory(w,0,false,deskRows);
   expect(w.stage).toBe('depart');
   expect(w.station).toEqual({x:640,y:795});
   expect(w.x).toBe(depX);
   expect(w.y).toBe(depY);
   expect(w.y+s0.sit).toBe(depFoot);
   expect(s0.scaleY).toBe(depScale);
  }
 }
});

test('VC-R1: every-frame sync + step maintains continuous world feet and scaleY across full transfers',()=>{
 const deskRows=[620,750,795,880];
 const w=makeWalker(335,655);
 const work1={x:640,y:620,zone:'work',activity:'work'};
 const work2={x:900,y:795,zone:'work',activity:'work'};
 const lounge={x:215,y:900,zone:'lounge',activity:'idle'};

 const trace=(target:{x:number;y:number;zone:string;activity:string},until:()=>boolean)=>{
  syncWorkstationTarget(w,target,false);
  let step=stepWorkstationTrajectory(w,0,false,deskRows);
  let prevFoot=w.y+step.sit,prevScale=step.scaleY,prevX=w.x;
  const stages=[w.stage];
  let maxFootDelta=0,maxScaleDelta=0,maxXDelta=0;
  for(let i=0;i<500;i++){
   syncWorkstationTarget(w,target,false);
   const s0=stepWorkstationTrajectory(w,0,false,deskRows);
   expect(Math.abs((w.y+s0.sit)-prevFoot)).toBeLessThanOrEqual(0.001);
   expect(Math.abs(s0.scaleY-prevScale)).toBeLessThanOrEqual(0.001);

   step=stepWorkstationTrajectory(w,16,false,deskRows);
   const foot=w.y+step.sit;
   maxFootDelta=Math.max(maxFootDelta,Math.abs(foot-prevFoot));
   maxScaleDelta=Math.max(maxScaleDelta,Math.abs(step.scaleY-prevScale));
   maxXDelta=Math.max(maxXDelta,Math.abs(w.x-prevX));
   expect(Math.abs(foot-prevFoot)).toBeLessThanOrEqual(6);
   expect(Math.abs(step.scaleY-prevScale)).toBeLessThanOrEqual(6);
   expect(Math.abs(w.x-prevX)).toBeLessThanOrEqual(6);
   if(stages[stages.length-1]!==w.stage)stages.push(w.stage);
   prevFoot=foot;prevScale=step.scaleY;prevX=w.x;
   if(until())break;
  }
  return {stages,maxFootDelta,maxScaleDelta,maxXDelta};
 };

 const toWork1=trace(work1,()=>w.stage==='work');
 expect(toWork1.stages).toEqual(['approach','seat','work']);

 const transfer=trace(work2,()=>w.stage==='work'&&w.station?.x===900);
 expect(transfer.stages).toEqual(['stand','depart','approach','seat','work']);

 const exit=trace(lounge,()=>w.stage==='idle'&&Math.hypot(w.x-215,w.y-900)<1);
 expect(exit.stages).toEqual(['stand','depart','idle']);
});

test('VC-R1: mid-exit destination changes and return-to-origin preserve continuity and zero-dt sync invariants',()=>{
 const deskRows=[620,750,795,880];
 const w=makeWalker(640,795);
 w.stage='work';w.station={x:640,y:795};w.bx=640;w.by=795;w.tx=640;w.ty=795;w.zone='work';w.arrived=1;
 const step=stepWorkstationTrajectory(w,0,false,deskRows);
 let prevFoot=w.y+step.sit,prevScale=step.scaleY;

 const assertZeroJumpSync=(target:{x:number;y:number;zone:string;activity:string})=>{
  syncWorkstationTarget(w,target,false);
  const s0=stepWorkstationTrajectory(w,0,false,deskRows);
  expect(Math.abs((w.y+s0.sit)-prevFoot)).toBeLessThanOrEqual(0.001);
  expect(Math.abs(s0.scaleY-prevScale)).toBeLessThanOrEqual(0.001);
  return s0;
 };
 const stepFrame=(target:{x:number;y:number;zone:string;activity:string},ms=16)=>{
  assertZeroJumpSync(target);
  const s=stepWorkstationTrajectory(w,ms,false,deskRows);
  const foot=w.y+s.sit;
  expect(Math.abs(foot-prevFoot)).toBeLessThanOrEqual(6);
  expect(Math.abs(s.scaleY-prevScale)).toBeLessThanOrEqual(6);
  prevFoot=foot;prevScale=s.scaleY;
  return s;
 };

 // Start standing toward lounge, retarget mid-stand to work-2, then mid-depart to work-3, then back to lounge.
 const lounge={x:215,y:900,zone:'lounge',activity:'idle'};
 const work2={x:900,y:795,zone:'work',activity:'work'};
 const work3={x:1160,y:620,zone:'work',activity:'work'};
 const work1={x:640,y:795,zone:'work',activity:'work'};

 for(let i=0;i<6;i++)stepFrame(lounge);
 expect(w.stage).toBe('stand');
 expect(w.station).toEqual({x:640,y:795});

 for(let i=0;i<5;i++)stepFrame(work2);
 expect(['stand','depart']).toContain(w.stage);
 expect(w.station).toEqual({x:640,y:795});

 while(w.stage==='stand')stepFrame(work2);
 expect(w.stage).toBe('depart');
 for(let i=0;i<10;i++)stepFrame(work3);
 expect(w.stage).toBe('depart');
 expect(w.station).toEqual({x:640,y:795});

 // Re-engage same work-1 station mid-depart behind desk -> must reverse cleanly to approach -> seat -> work without jumping.
 assertZeroJumpSync(work1);
 expect(w.stage).toBe('approach');
 while(w.stage!=='work')stepFrame(work1);
 expect(w.x).toBe(640);expect(w.y).toBe(795);

 // Simulated camera/resize zero-dt sync across stand -> depart -> approach(work3) -> seat -> work.
 stepFrame(work3);
 while(w.stage!=='work'||w.station?.x!==1160){
  assertZeroJumpSync(work3);
  stepFrame(work3);
 }
 expect(w.x).toBe(1160);expect(w.y).toBe(620);
});
