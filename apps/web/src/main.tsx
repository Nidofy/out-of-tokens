import {render} from 'preact';
import {AlphaApp,preloadWorkshop} from './alpha-app.js';
import './style.css';
import './village-ui.css';
import './vf1.css';
if((import.meta.env.DEV||import.meta.env.MODE==='visual-review')&&new URLSearchParams(location.search).has('vf-metrics'))void import('./vf-metrics.js').then(m=>m.startVisualMetrics());
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('scene-lab'))void import('./scene-lab.js').then(({SceneLab})=>render(<SceneLab/>,document.getElementById('app')!));else {preloadWorkshop();render(<AlphaApp/>,document.getElementById('app')!);}
