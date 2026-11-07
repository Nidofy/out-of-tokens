import {engineVersion} from 'oot-core';
export type FlavorContext={actor:string;scene:string;slot:number;language:'zh'|'en';mood:number;version:string};
export type FlavorPack={schemaVersion:1;id:string;version:string;engine:string;author:string;license:string;lines:{id:string;zh:string;en:string}[]};
const safeText=(s:unknown)=>typeof s==='string'&&s.length>0&&s.length<=120&&!/[<>\u0000-\u001f]/u.test(s)&&!/(https?:|javascript:|傻逼|fuck|shit)/iu.test(s);
export function parseFlavorPack(text:string):FlavorPack{
 if(text.length>64000)throw Error('PACK_TOO_LARGE');
 const p=JSON.parse(text) as FlavorPack;
 if(!p||Object.keys(p).some(k=>!['schemaVersion','id','version','engine','author','license','lines'].includes(k))||p.schemaVersion!==1||typeof p.id!=='string'||!/^[-a-z0-9]{1,40}$/.test(p.id)||p.engine!==engineVersion||![p.version,p.author,p.license].every(safeText)||!Array.isArray(p.lines)||p.lines.length<1||p.lines.length>100)throw Error('INVALID_FLAVOR_PACK');
 const ids=new Set<string>();
 for(const line of p.lines){if(!line||Object.keys(line).some(k=>!['id','zh','en'].includes(k))||typeof line.id!=='string'||!/^[-a-z0-9]{1,40}$/.test(line.id)||!safeText(line.zh)||!safeText(line.en)||ids.has(line.id))throw Error('INVALID_FLAVOR_LINE');ids.add(line.id);line.id=p.id+':'+line.id;}
 return p;
}
const corpus={zh:['我把月亮排进了日程。','服务器想喝一杯热茶。','这朵云今天准时下班。','书签在梦里编译春天。'],en:['The moon has a deadline.','The server would like some tea.','This cloud clocks out on time.','A bookmark compiles spring.']};
/** Tiny character bigram model trained only on original bundled prose. Separate from simulation RNG. */
export function flavor(c:FlavorContext,retro=false,pack?:FlavorPack):string{
 const fallback=c.language==='zh'?(c.mood<30?'先歇一会儿，再继续吧。':c.scene==='library'?'这页值得慢慢读。':'我们一件一件来。'):(c.mood<30?'A short rest first.':c.scene==='library'?'One more quiet page.':'One task at a time.');
 let seed=2166136261;for(const ch of `${c.actor}|${c.version}|${c.scene}|${c.slot}`)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
 if(pack){const line=pack.lines[seed%pack.lines.length];const value=c.language==='zh'?line?.zh:line?.en;return safeText(value)?Array.from(value!).slice(0,c.language==='zh'?20:80).join(''):fallback;}
 if(!retro)return fallback;
 const transitions=new Map<string,string[]>();for(const line of corpus[c.language]){const chars=['^',...line,'$'];for(let i=0;i<chars.length-1;i++){const key=chars[i]!;transitions.set(key,[...(transitions.get(key)??[]),chars[i+1]!]);}}
 let key='^',out='';for(let i=0;i<(c.language==='zh'?20:80);i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const options=transitions.get(key);if(!options?.length)break;key=options[seed%options.length]!;if(key==='$')break;out+=key;}
 return safeText(out)?out:fallback;
}
