import {useEffect,useRef} from 'preact/hooks';
import type {ComponentChildren} from 'preact';
import {Icon} from './icons.js';
export const chapterPlaces=[['开源车库','The open-source garage'],['共享孵化器','The incubator'],['城市事务所','The city studio'],['创意园区','The campus'],['AGI 实验室','The AGI lab']] as const;
export const sceneArt=(scene:string,chapter:number)=>`./art/${scene==='workshop'?['garage','incubator','office','campus','lab'][Math.min(4,chapter)]:scene}.webp`;
export const actorIds=['bluewhale','qwen','llama','mistral','gpt','claude','kimi','gemini','grok','glm','minimax','seedance'];
export function Portrait({id,large=false}:{id:string;large?:boolean}){return <img loading="lazy" decoding="async" class={`portrait ${large?'portrait-large':''}`} src={`./art/ai-village/portraits/${id}.png`} alt=""/>;}
const scrolls:Record<string,number>={};
export function Drawer({title,route,close,children}:{title:string;route:string;close:()=>void;children:ComponentChildren}){
 const ref=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;button.current?.focus({preventScroll:true});return()=>{if(previous?.isConnected)previous.focus({preventScroll:true});};},[]);
 useEffect(()=>{if(ref.current)ref.current.scrollTop=scrolls[route]??0;},[route]);
 return <section class="studio-drawer" aria-label={title} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close();}}}><header class="drawer-head"><button ref={button} onClick={close} aria-label="返回场景 / Back to scene"><Icon name="back"/></button><h2>{title}</h2><button onClick={close} aria-label="关闭面板 / Close panel"><Icon name="close"/></button></header><div class="drawer-content" ref={ref} onScroll={e=>{scrolls[route]=e.currentTarget.scrollTop;}}>{children}</div></section>;
}
