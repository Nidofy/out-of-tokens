export const souvenirIds=['slime','castle','paper'] as const;
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
