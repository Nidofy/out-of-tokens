import { createInitialState, dispatchCommand } from 'oot-core';
import type { Command, Content } from 'oot-core';
import { EXPERIENCE_CONTRACT } from './checkpoint-contract.js';
import type { SaveStatus, WorkerSnapshot } from './checkpoint-contract.js';
import type { NextPeriodPreview } from './experience-contract.js';
export const experienceFixtureNames = ['opening-menu','night-e40-load5','overtime','training','review-ready','cloud-quota-stop','save-conflict','external-change-paused','storage-unavailable'] as const;
export type ExperienceFixtureName = typeof experienceFixtureNames[number];
export interface ExperienceFixture { developmentOnly: true; snapshot: WorkerSnapshot; saveStatus: SaveStatus; command: Command | null }
export function experienceFixture(name: 'night-rest' | 'pending-choice'): NextPeriodPreview;
export function experienceFixture(name: ExperienceFixtureName, content: Content): ExperienceFixture;
export function experienceFixture(name: ExperienceFixtureName | 'night-rest' | 'pending-choice', content?: Content): ExperienceFixture | NextPeriodPreview {
    const identity = {contract:EXPERIENCE_CONTRACT,contentVersion:content?.version??'fixture-only',revision:0,lineageId:'fixture-only:'+name};
    if (name === 'night-rest' || name === 'pending-choice') return {
        ...identity, slot:3,nextSlot:4,working:[],resting:name==='night-rest'?[{reason:'night-sleep',actorId:'qwen',certainty:'certain'}]:[],
        recoverySkipped:[],waiting:[],stops:[],deadlines:[],bills:[],blocked:name==='pending-choice'?'pending-choice':null,
    };
    if (!content) throw Error('FIXTURE_CONTENT_REQUIRED');
    let state = createInitialState(content, 1);
    let command: Command | null = null;
    const actor = state.actors.find(a=>a.id==='qwen')??state.actors[0]!;
    if (name === 'night-e40-load5') {
        state.absoluteSlot=3;actor.energy=40;actor.load=5;
        if(state.campaign) state.campaign.scene='library';
        command={type:'campaign',action:'chat',id:actor.id};
    }
    if(name==='training') {
        if(state.campaign)state.campaign.research=10;
        command={type:'campaign',action:'train',id:actor.id,target:'write'};
    }
    if(['overtime','review-ready','cloud-quota-stop'].includes(name)) {
        const job=state.jobs[0]!;
        for(const cmd of [{type:'accept',job:job.id},{type:'assign',job:job.id,team:[{character:actor.id,role:'worker',mode:'cloud'}]}] as Command[]) {
            const r=dispatchCommand(state,cmd,content);if(r.error)throw Error('FIXTURE_SETUP:'+r.error);state=r.state;
        }
        if(name==='overtime') {state.absoluteSlot=3;command={type:'overtime',character:actor.id};}
        if(name==='review-ready'){const j=state.jobs[0]!;j.status='review';j.progress=j.work;j.quality=75;command={type:'deliver',job:j.id};}
        if(name==='cloud-quota-stop'){state.quota=0;state.purchased=0;command={type:'advance'};}
    }
    let saveStatus: SaveStatus={...identity,kind:'idle'};
    if(name==='save-conflict')saveStatus={...identity,kind:'paused',cause:'conflict'};
    if(name==='external-change-paused')saveStatus={...identity,kind:'paused',cause:'external-change'};
    if(name==='storage-unavailable')saveStatus={...identity,kind:'error',code:'STORAGE_UNAVAILABLE',exportable:true};
    return {developmentOnly:true,snapshot:{...identity,seed:state.seed,state},saveStatus,command};
}
