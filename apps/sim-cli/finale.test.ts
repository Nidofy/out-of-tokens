import {test,expect} from 'vitest';
import {loadFullContent,loadAlphaContent} from 'oot-content';
import {createInitialState,dispatchCommand,endingReady,worlds} from 'oot-core';
import type {State,Content} from 'oot-core';
import {hash,save,restore} from 'oot-persistence';
const act=(s:State,c:Content,action:string,id:string,target?:string)=>dispatchCommand(s,{type:'campaign',action,id,target},c);
test('M5 chapter gates reject shortcuts and existing Alpha remains chapter 2',()=>{
 const c=loadFullContent(),s=createInitialState(c,1),before=hash(s);
 for(const action of ['expedition','ending','endless','bid','challenge','chapter']){const r=act(s,c,action,'qwen','slime');expect(r.error,action).toBeTruthy();expect(r.state).toBe(s);expect(hash(s)).toBe(before);}
 expect(createInitialState(loadAlphaContent(),1).campaign!.finale).toBeUndefined();
 s.campaign!.chapter=3;s.reputation=20;s.cash=10000;s.campaign!.hardware.network=2;s.campaign!.finale!.bids=[{job:'x',rival:'budget',won:true}];
 const r=act(s,c,'chapter','next');expect(r.error).toBeNull();expect(r.state.campaign!.chapter).toBe(4);
 expect(act(r.state,c,'chapter','next').error).toBe('CHAPTER_LOCKED');
});
test('expeditions occupy a character and award each return once',()=>{
 const c=loadFullContent();c.events=[];c.balance!.eventChance=0;let s=createInitialState(c,1);s.campaign!.chapter=3;
 const before=hash(s);const r=act(s,c,'expedition','qwen','slime');expect(r.error).toBeNull();expect(hash(s)).toBe(before);s=r.state;
 expect(s.cash).toBe(4880);expect(act(s,c,'expedition','qwen','slime').error).toBe('ACTOR_BUSY');
 for(let i=0;i<8;i++)s=dispatchCommand(s,{type:'advance'},c).state;
 expect(s.campaign!.finale!.souvenirs).toEqual(['slime']);expect(s.campaign!.research).toBe(3);
 s=dispatchCommand(s,{type:'advance'},c).state;expect(s.campaign!.research).toBe(3);
 expect(worlds).toHaveLength(3);
});
test('rival bids charge once, disclose win/loss and affect advance amount',()=>{
 const c=loadFullContent(),s=createInitialState(c,1);s.campaign!.chapter=2;s.reputation=10;s.jobs[0]!.hidden=0;
 const r=act(s,c,'bid',s.jobs[0]!.id,'budget');expect(r.error).toBeNull();expect(r.state.cash).toBe(s.cash-60);expect(r.state.jobs[0]!.rewardFactor).toBe(.85);
 expect(act(r.state,c,'bid',s.jobs[0]!.id,'budget').error).toBe('BID_LOCKED');
 const accepted=dispatchCommand(r.state,{type:'accept',job:s.jobs[0]!.id},c);const t=c.commissions.find(t=>t.id===s.jobs[0]!.template)!;
 expect(accepted.state.jobs[0]!.advance).toBe(Math.round(t.reward*.85*c.balance!.rewardScale*.3*100)/100);
 const lost=createInitialState(c,1);lost.campaign!.chapter=2;const loss=act(lost,c,'bid',lost.jobs[0]!.id,'boutique');expect(loss.error).toBeNull();expect(loss.state.jobs[0]!.status).toBe('rejected');
});
test('five ending predicates, ending freeze and explicit endless continuation',()=>{
 const c=loadFullContent();let s=createInitialState(c,1);s.campaign!.completed=[0,1,2,3,4];s.campaign!.chapter=4;
 expect(endingReady(s,c,'independent')).toBe(false);expect(endingReady(s,c,'acquired')).toBe(true);
 expect(endingReady(s,c,'warm-shop')).toBe(false);expect(endingReady(s,c,'open-source')).toBe(false);expect(endingReady(s,c,'paperclip')).toBe(false);
 s=act(s,c,'ending','acquired').state;expect(dispatchCommand(s,{type:'advance'},c).error).toBe('ENDING_FINISHED');
 s=act(s,c,'endless','continue').state;expect(s.campaign!.finale!.endless).toBe(true);expect(act(s,c,'ending','acquired').error).toBe('ENDING_LOCKED');
 expect(dispatchCommand(s,{type:'advance'},c).error).toBeNull();
});
test('weekly challenge assignment guard cannot be bypassed with old teams',()=>{
 const c=loadFullContent();c.events=[];let s=createInitialState(c,1);s.campaign!.finale!.endless=true;s.absoluteSlot=28;
 s=dispatchCommand(s,{type:'accept',job:'0-0'},c).state;
 const team=[{character:'qwen',role:'worker',mode:'cloud'}];expect(dispatchCommand(s,{type:'assign',job:'0-0',team},c).error).toBe('CHALLENGE_TEAM');
 s.jobs[0]!.status='working';s.jobs[0]!.team=[{character:'qwen',role:'worker',mode:'cloud'}];const r=dispatchCommand(s,{type:'advance'},c);expect(r.state.jobs[0]!.progress).toBe(0);
});
test('full campaign state and ordinary life replay; old engine and content rejected',()=>{
 const c=loadFullContent();c.events=[];let s=createInitialState(c,1);const commands=[{type:'advance'},{type:'advance'},{type:'campaign',action:'visit',id:'library'},{type:'campaign',action:'meal',id:'qwen'}];
 for(const cmd of commands){const r=dispatchCommand(s,cmd,c);expect(r.error).toBeNull();s=r.state;}
 const text=save(c,1,commands,s);expect(hash(restore(c,text).state)).toBe(hash(s));expect(()=>restore(loadAlphaContent(),text)).toThrow('INCOMPATIBLE_SAVE');
});
test('every ending has a reachable explicit predicate and cannot be claimed twice',()=>{
 const c=loadFullContent();let s=createInitialState(c,1);s.cash=100000;s.reputation=100;s.campaign!.chapter=4;
 for(const r of c.campaign!.recruits)s=act(s,c,'recruit',r.character).state;
 s.campaign!.completed=[0,1,2,3,4];s.campaign!.chapter=4;
 for(const r of Object.values(s.campaign!.relations))r.affinity=85;
 for(const ending of ['independent','acquired','warm-shop','open-source']){const r=act(s,c,'ending',ending);expect(r.error,ending).toBeNull();expect(r.state.campaign!.finale!.ending).toBe(ending);expect(s.campaign!.finale!.ending).toBeNull();}
 for(const r of Object.values(s.campaign!.relations))r.affinity=0;
 s.absoluteSlot=112;s.campaign!.finale!.souvenirs=['paper'];s.ledger=Array.from({length:28},(_,i)=>({slot:1+i*4,amount:1,reason:'delivery:'+i}));
 expect(act(s,c,'ending','paperclip').error).toBeNull();
});
test('M5 editorial draft has 60 distinct bilingual scenes without Chinese in English text',()=>{
 const stories=loadFullContent().campaign!.stories!;
 expect(new Set(stories.map(s=>s.text)).size).toBe(60);
 expect(new Set(stories.map(s=>JSON.stringify(s.choices))).size).toBe(60);
 for(const s of stories)expect(s.textEn).not.toMatch(/[\u4e00-\u9fff]/);
});
