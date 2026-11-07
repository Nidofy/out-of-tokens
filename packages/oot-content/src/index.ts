import { readFileSync } from 'node:fs';
import type { Content } from 'oot-core';
import { validateContent, contentVersion } from './browser.js';
export { validateContent } from './browser.js';
export function loadContent(): Content {
    const read = (path: string): unknown => JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
    return validateContent({ version: contentVersion, versions: read('versions/initial.json'), commissions: read('commissions/initial.json'), events: read('events/initial.json'), balance: read('balance/standard.json') });
}
export function loadCampaignContent(): Content {
    const read = (path: string): unknown => JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
    const c = loadContent();
    return validateContent({ ...c, version: 'm1-1', events: [...c.events, ...read('campaign/events-m1.json') as Content['events']], versions: read('campaign/versions-m1.json'), campaign: read('campaign/m1.json') });
}

export function loadAlphaContent(): Content {
 const read=(path:string):unknown=>JSON.parse(readFileSync(new URL(`../../../content/${path}`,import.meta.url),'utf8'));
 return validateContent({...loadContent(),version:'m2-1',versions:read('campaign/versions-m2.json'),commissions:read('campaign/commissions-m2.json'),events:read('campaign/events-m2.json'),campaign:read('campaign/m2.json')});
}

export function loadFullContent(): Content {
 const campaign=JSON.parse(readFileSync(new URL('../../../content/campaign/m5.json',import.meta.url),'utf8'));
 const read=(name:string)=>JSON.parse(readFileSync(new URL('../../../content/campaign/'+name,import.meta.url),'utf8'));
 return validateContent({...loadAlphaContent(),version:'m5-4',campaign,commissions:read('commissions-m5.json'),events:read('events-m5.json')});
}
