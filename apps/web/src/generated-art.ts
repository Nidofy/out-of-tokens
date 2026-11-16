export const souvenirIds=['slime','castle','paper'] as const;
export function chapterBannerArt(chapter:number):string{
 const id=chapter===0?'garage':chapter===1?'incubator':chapter===2?'release-night':chapter===3?'crisis-429':'last-token';
 return `./art/cards/project-${id}.webp`;
}
export function projectCoverArt(projectId:string,chapter=1):string{
 return projectId==='incubator'?'./art/cards/project-incubator.webp':chapterBannerArt(chapter);
}
export function financeArt(kind:'quota-pack'|'plan-basic'|'plan-pro'|'ledger-loan'):string{
 return `./art/upgrades/finance-${kind}.webp`;
}
export const ritualBackdropArt='./art/cards/ritual-stage-backdrop.webp';
export const stampSealCrestArt='./art/cards/stamp-seal-crest.webp';
export function eventArt(id:string){
 const groups:Record<string,string[]>={
 breakthrough:['thinking','aha','cache','rubric','dataset','benchmark','first-version'],
 change:['busy','tiny-change','scope','deadline','handoff','long-title','format','missing-unit','delivery-link'],
 compute:['context','rate-limit','loop','delete','sla-warning','fan-noise','downgrade','offline-demo','test-flake'],
 industry:['license','injection','consent','image-credit','silent-update','release-notes','finale-event-0','finale-event-1','finale-event-2','finale-event-3']
 };
 const category=Object.entries(groups).find(([,ids])=>ids.includes(id))?.[0]??'daily';
 return `./art/cards/event-${category}.webp`;
}

export function softwareArt(id:string){
 const groups:Record<string,string[]>={
  mcp:['mcp','sandbox','remote'],
  explain:['explain','search','rag','analyst','filter'],
  monitor:['monitor','ci','autotest'],
  messenger:['messenger','crm','multiagent']
 };
 const category=Object.entries(groups).find(([,ids])=>ids.includes(id))?.[0]??'tools';
 return `./art/upgrades/software-${category}.webp`;
}
