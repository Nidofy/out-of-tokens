// Presentation coordinates only. Never written into simulation/save state.
export const sceneSpec = {
 contacts:{feet:{x:0,y:6},seat:{x:0,y:-40},keyboard:{x:0,y:-20},meal:{x:0,y:-35},book:{x:0,y:-30}},
};
export function scenePageSize(width:number){return width<1000?2:4;}
