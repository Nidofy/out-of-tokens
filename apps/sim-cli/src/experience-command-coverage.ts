import type {Command} from 'oot-core';
// Explicit review inventory: new commands/actions cannot silently bypass availability review.
export const commandCoverage:Record<Command['type'],'activity'|'settlement'>={
    campaign:'activity',office:'activity',scope:'activity',overtime:'activity',loan:'activity',repay:'activity',
    restart:'settlement',advance:'settlement',choose:'settlement',accept:'activity',reject:'activity',
    deliver:'settlement',rework:'activity',clarify:'activity',respond:'activity',assign:'activity',buy:'activity',
};
export const campaignCoverage:Record<Extract<Command,{type:'campaign'}>['action'],'occupancy-or-location'|'gain-only'|'other'>={
    train:'occupancy-or-location',align:'occupancy-or-location',chat:'occupancy-or-location',gift:'occupancy-or-location',
    meal:'occupancy-or-location',study:'occupancy-or-location',recall:'occupancy-or-location',story:'occupancy-or-location',expedition:'occupancy-or-location',
    tea:'gain-only',duo:'gain-only','chat-reply':'gain-only',
    'project-start':'other','project-next':'other',visit:'other',recruit:'other',unlock:'other',switch:'other',
    software:'other',hardware:'other',chapter:'other',subscribe:'other',ending:'other',endless:'other',bid:'other',challenge:'other',
};
