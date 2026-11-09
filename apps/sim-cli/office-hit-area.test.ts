import {expect,test} from 'vitest';
import {actorHitArea,furnitureHitArea} from '../web/src/office-hit-area.js';

test.each(['basic','standard'])('%s transparent front leaves face/body reachable while desk and monitor remain interactive',kind=>{
 const hit=furnitureHitArea(kind,'front');
 expect(hit.contains(0,-138)).toBe(false); // seated face
 expect(hit.contains(0,-100)).toBe(false); // upper body
 expect(hit.contains(-125,-180)).toBe(false); // transparent canvas margin
 expect(hit.contains(0,-62)).toBe(true); // desktop
 expect(hit.contains(80,-100)).toBe(true); // visible monitor
 expect(hit.contains(0,60)).toBe(false); // outside footprint
});
test.each(['whiteboard','coffee','sofa','server'])('%s empty front never intercepts its back or a character',kind=>{
 expect(furnitureHitArea(kind,'front').contains(0,-100)).toBe(false);
 expect(furnitureHitArea(kind,'back').contains(0,-100)).toBe(true);
});
test.each(['dining','reading'])('%s empty back is non-interactive',kind=>{
 expect(furnitureHitArea(kind,'back').contains(0,-100)).toBe(false);
 expect(furnitureHitArea(kind,'front').contains(0,-62)).toBe(true);
});

test('seated head moves up with the body and leaves desktop ownership to furniture',()=>{
 const actor=actorHitArea(true),desk=furnitureHitArea('standard','front');
 expect(actor.contains(0,-210)).toBe(true);
 expect(desk.contains(0,-210)).toBe(false);
 expect(actor.contains(0,-100)).toBe(true);
 expect(actor.contains(0,-62)).toBe(false);
 expect(desk.contains(0,-62)).toBe(true);
});
test('two meeting seats leave a central whiteboard hit corridor',()=>{
 const actor=actorHitArea(false),board=furnitureHitArea('whiteboard','back');
 for(const x of [-27,0,27]){
  expect(actor.contains(x+72,-120)).toBe(false);
  expect(actor.contains(x-72,-120)).toBe(false);
  expect(board.contains(x,-120)).toBe(true);
 }
 expect(actor.contains(0,-120)).toBe(true);
});
