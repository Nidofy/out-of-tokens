import {expect,test} from 'vitest';
import {furnitureHitArea} from '../web/src/office-hit-area.js';

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
