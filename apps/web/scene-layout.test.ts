import {test,expect} from 'vitest';
import {stationLayout,reactionFor,activityFor} from './src/scene-layout.js';
import {loadFullContent} from 'oot-content';
import {createInitialState,getViewModel} from 'oot-core';
test.each([[390,844],[1280,720],[680,900]])('12 actor bounds do not overlap or leave viewport %s×%s',(w,h)=>{
 const layout=stationLayout(w,h,12),bounds=layout.map(p=>({left:p.x-70*p.scale,right:p.x+70*p.scale,top:p.y-150*p.scale,bottom:p.y+85*p.scale}));
 for(const b of bounds){expect(b.left).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(w);expect(b.bottom).toBeLessThan(h);}
 for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++){const a=bounds[i]!,b=bounds[j]!;expect(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top).toBe(true);}
});
test('only involved actors react to delivery; reviewers have a distinct activity',()=>{
 const c=loadFullContent(),s=createInitialState(c,1),j=s.jobs[0]!;j.status='working';j.team=[{character:'qwen',role:'reviewer',mode:'local'}];s.ledger.push({slot:0,reason:`delivery:${j.id}`,amount:100});const v=getViewModel(s,c);
 expect(reactionFor(v,'qwen')).toBe('happy');expect(reactionFor(v,'llama')).toBe('neutral');expect(activityFor(v,'qwen')).toBe('review');
});
