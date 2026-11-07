interface Connection {state:{getSnapshot():string;subscribe(fn:()=>void):()=>void}}
interface ClientContext {get(name:'connection'):Connection;effect(factory:()=>()=>void|Promise<void>):unknown;on(event:'connection/reset',fn:()=>void):unknown}
export const name='out-of-tokens-client';
export const inject=['connection'];
export function apply(ctx:ClientContext){
 const connection=ctx.get('connection');let disposed=false,sequence=0,waiting:{id:number;resolve:(ok:boolean)=>void}|null=null;
 const launch=document.createElement('button');launch.type='button';launch.textContent='AI 工坊 / Workshop';launch.dataset.ootLauncher='true';
 const panel=document.createElement('dialog');panel.dataset.ootPanel='true';panel.style.cssText='width:94vw;height:92vh;padding:8px;border:2px solid #52765e;border-radius:16px;background:#fcf7e8;max-width:1600px;max-height:96vh';
 const close=document.createElement('button');close.type='button';close.textContent='保存并关闭 / Save & close';
 const status=document.createElement('span');status.setAttribute('role','status');
 const frame=document.createElement('iframe');frame.title='Out of Tokens';frame.sandbox.add('allow-scripts','allow-same-origin','allow-downloads');frame.style.cssText='display:block;width:100%;height:calc(100% - 32px);border:0';frame.referrerPolicy='same-origin';
 panel.append(close,status,frame);document.body.append(panel);
 let ready=false;
 let checkpointFlight:Promise<boolean>|null=null;
 function mount(){if(disposed)return;const corner=document.querySelector('[data-conversation-header-corner]');if(corner&&launch.parentNode!==corner){launch.style.cssText='';corner.append(launch);}else if(!corner&&!launch.isConnected){document.body.append(launch);launch.style.cssText='position:fixed;right:16px;bottom:16px;z-index:9999';}}
 const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true,subtree:true});mount();
 function open(){if(disposed)return;if(connection.state.getSnapshot()!=='connected'){status.textContent='连接已断开 / Disconnected';return;}if(!frame.src)frame.src='/out-of-tokens/web/index.html?dsh=1';status.textContent='';if(!panel.open)panel.showModal();frame.focus();}
 function checkpoint():Promise<boolean>{if(!frame.src||!ready)return Promise.resolve(true);if(checkpointFlight)return checkpointFlight;checkpointFlight=new Promise<boolean>(resolve=>{const id=++sequence;const timer=setTimeout(()=>{if(waiting?.id===id){waiting=null;resolve(false);}},11000);waiting={id,resolve:ok=>{clearTimeout(timer);waiting=null;resolve(ok);}};frame.contentWindow?.postMessage({type:'oot:checkpoint',id},location.origin);}).finally(()=>{checkpointFlight=null;});return checkpointFlight;}
 function receive(e:MessageEvent){if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='oot:ready'){ready=true;return;}if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='oot:checkpoint-result'||e.data.id!==waiting?.id)return;waiting?.resolve(e.data.ok===true);}
 async function hide(){close.disabled=true;status.textContent='保存中 / Saving…';const ok=await checkpoint();close.disabled=false;if(ok){panel.close();launch.focus();}else status.textContent='保存未确认，请载入对账或导出 / Save unconfirmed: reload or export';}
 const cancel=(e:Event)=>{e.preventDefault();void hide();};
 const mapClick=(e:MouseEvent)=>{if(e.target instanceof Element&&e.target.closest('.village-community-map button[data-place="workshop"]')){e.preventDefault();e.stopPropagation();open();}};
 const connectionChanged=()=>{if(connection.state.getSnapshot()!=='connected')status.textContent='连接已断开，请勿重复写入 / Disconnected; do not retry writes';};
 launch.addEventListener('click',open);close.addEventListener('click',hide);panel.addEventListener('cancel',cancel);document.addEventListener('click',mapClick,true);window.addEventListener('message',receive);const unsubscribe=connection.state.subscribe(connectionChanged);ctx.on('connection/reset',connectionChanged);
 ctx.effect(()=>async()=>{disposed=true;observer.disconnect();unsubscribe();document.removeEventListener('click',mapClick,true);launch.remove();await checkpoint();window.removeEventListener('message',receive);panel.remove();});
}
