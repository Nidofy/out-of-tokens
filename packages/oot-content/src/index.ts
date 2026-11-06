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
