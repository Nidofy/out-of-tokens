const paths:Record<string,string>={
 people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 briefcase:'M9 6V3h6v3M3 7h18v14H3zM3 12c6 4 12 4 18 0M12 11v5',
 home:'M3 10l9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
 book:'M12 5c-3-2-6-2-10-1v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1v16',
 map:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5M9 3v16M15 5v16',
 save:'M4 3h13l4 4v14H3V3h1M7 3v7h10V3M7 21v-7h10v7',
 settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
 wallet:'M20 8V4H4a2 2 0 0 0 0 4h18v13H4a2 2 0 0 1-2-2V6M22 12h-6v5h6M18 14h1',
 bolt:'M13 2L4 14h7l-1 8 10-13h-7l1-7',chip:'M7 7h10v10H7zM9 2v5M15 2v5M9 17v5M15 17v5M2 9h5M2 15h5M17 9h5M17 15h5',
 star:'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',arrow:'M4 12h16M14 6l6 6-6 6',
 sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1',
 moon:'M20 15a9 9 0 0 1-11-11A9 9 0 1 0 20 15',close:'M6 6l12 12M6 18L18 6',back:'M20 12H4M10 6l-6 6 6 6'
};
export function Icon({name}:{name:string}){return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths[name]??paths.star}/></svg>;}
