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
