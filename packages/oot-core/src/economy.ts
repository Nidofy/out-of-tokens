import type { Balance, Content, State } from './model.js';
export const defaults: Balance = { startingCash: 5000, debt: 8000, debtSlot: 56, weekly: 2300, dailyQuota: 300, upgradedQuota: 600, localCapacity: 120, loanLimit: 5000, interest: 0.05, eventChance: 0.25, rewardScale: 1, crisisLength: 12, bankruptcyFloor: -20000 };
export const balance = (c: Content) => c.balance ?? defaults;
export const round = (n: number) => Math.round(n * 100) / 100;
export function crisis(s: State, c: Content) {
    const b = balance(c);
    s.crises = s.crises.filter(n => s.absoluteSlot - n < 112);
    // Advances are liabilities until a milestone is accepted: borrowing customer money cannot erase a crisis.
    const liquid = s.cash - s.jobs.filter(j => ['accepted', 'working', 'review', 'waiting'].includes(j.status)).reduce((n, j) => n + j.advance, 0);
    if (liquid < 0) {
        if (s.crisisSince === null || s.absoluteSlot - s.crisisSince >= b.crisisLength) {
            s.crisisSince = s.absoluteSlot;
            s.crises.push(s.absoluteSlot);
            if (s.crises.length === 2)
                s.reputation = Math.floor(s.reputation * 0.8);
        }
        if (s.cash < b.bankruptcyFloor || s.crises.length >= 3)
            s.bankrupt = true;
    }
    else
        s.crisisSince = null;
    s.peakReputation = Math.max(s.peakReputation, s.reputation);
}
