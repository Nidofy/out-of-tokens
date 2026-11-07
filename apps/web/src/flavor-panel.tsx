import {useEffect,useState} from 'preact/hooks';
import {flavor,parseFlavorPack} from './flavor.js';
import type {FlavorContext} from './flavor.js';
export function FlavorPanel({context}:{context:FlavorContext}){
 const [enabled,setEnabled]=useState(false),[retro,setRetro]=useState(false),[pack,setPack]=useState<string>(),[status,setStatus]=useState(''),[text,setText]=useState('');
 const en=context.language==='en';
 useEffect(()=>{if(!enabled)return;let worker:Worker|undefined;let stopped=false;const fallback=()=>{if(!stopped)setText(flavor(context));};fallback();const timer=setTimeout(()=>{worker?.terminate();fallback();},500);
 try{worker=new Worker(new URL('./flavor-worker.ts',import.meta.url),{type:'module'});worker.onmessage=e=>{clearTimeout(timer);if(!stopped)setText(e.data.error?flavor(context):String(e.data.text));worker?.terminate();};worker.onerror=()=>{clearTimeout(timer);fallback();worker?.terminate();};worker.postMessage({id:1,context,retro,pack});}catch{fallback();}
 return()=>{stopped=true;clearTimeout(timer);worker?.terminate();};},[enabled,retro,pack,context.actor,context.slot,context.scene,context.language,context.mood,context.version]);
 const load=async(file:File|undefined)=>{if(!file)return;try{if(file.size>64000)throw Error('PACK_TOO_LARGE');const raw=await file.text();const parsed=parseFlavorPack(raw);setPack(raw);setStatus(`${parsed.id} · ${parsed.author} · ${parsed.license}`);}catch{setStatus(en?'Invalid pack; previous pack retained.':'内容包无效，保留当前包。');}};
 return <details><summary>{en?'Local dialogue & packs':'本地气泡与内容包'}</summary><p>{en?'Atmosphere only. No network or game effects.':'只生成氛围文本，不联网、不影响经营结算。'}</p><label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.currentTarget.checked)}/>{en?'Enable dialogue':'开启气泡'}</label><label><input type="checkbox" checked={retro} onChange={e=>setRetro(e.currentTarget.checked)}/>{en?'Retro tiny text model':'复古微型文本模型'}</label>{enabled&&<p role="status">{text}</p>}<label>{en?'Import dialogue pack (JSON, 64 KB)':'导入对话包（JSON，64 KB）'}<input type="file" accept=".json" onChange={e=>void load(e.currentTarget.files?.[0])}/></label><button onClick={()=>{setPack(undefined);setStatus('');}}>{en?'Remove pack':'卸载内容包'}</button><p>{status}</p></details>;
}
