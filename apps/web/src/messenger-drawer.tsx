import {useEffect,useState} from 'preact/hooks';
import {Dialog} from './dialog.js';
import {Icon} from './icons.js';
import {names} from './presentation.js';
import {characterPosters} from './character-profiles.js';
import type {LivingThreadView} from './living-adapter.js';

type Props={
 open:boolean;
 close:()=>void;
 threads:readonly LivingThreadView[];
 english:boolean;
 still:boolean;
 locked:boolean;
 onReply:(threadId:string,replyIndex:number)=>void;
 returnFocus?:()=>HTMLElement|null;
};

export function MessengerDrawer({open,close,threads,english,still,locked,onReply,returnFocus}:Props){
 const tr=(zh:string,en:string)=>english?en:zh;
 const [selectedId,setSelectedId]=useState<string>('');
 const [typing,setTyping]=useState(false);

 useEffect(()=>{
  if(!open)return;
  const unread=threads.find(t=>t.chosenReply===null);
  setSelectedId(prev=>threads.some(t=>t.id===prev)?prev:(unread?.id??threads[0]?.id??''));
 },[open,threads]);

 useEffect(()=>{
  if(!open||still){setTyping(false);return;}
  setTyping(true);
  const t=setTimeout(()=>setTyping(false),280);
  return()=>clearTimeout(t);
 },[selectedId,open,still]);

 if(!open)return null;
 const active=threads.find(t=>t.id===selectedId)??threads[0]??null;
 const chosen=active&&active.chosenReply!==null?active.replies[active.chosenReply]:null;

 return (
  <Dialog system className="ui2-messenger-dialog" title={tr('工坊群聊 · 工作台频道','Studio Messenger')} close={close} {...(returnFocus?{returnFocus}:{})}>
   <div class="ui2-messenger-layout">
    <div class="ui2-thread-list" role="tablist" aria-label={tr('群聊话题列表','Message threads')}>
     {threads.length===0&&<p class="ui2-muted-note">{tr('还没有收发过群聊动态。','No chat threads yet.')}</p>}
     {threads.map(t=>{
      const unread=t.chosenReply===null;
      const speaker=t.messages[0]?.speaker??'qwen';
      return (
       <button key={t.id} role="tab" aria-selected={active?.id===t.id} class="ui2-thread-item" onClick={()=>setSelectedId(t.id)}>
        <img src={`./art/ai-village/portraits/${speaker}.png`} alt=""/>
        <span>
         <b>{english?t.titleEn:t.title}</b>
         <small>{unread?tr('待回复 · 好感+2','Reply · +2 Aff'):tr('已回复','Replied')}</small>
        </span>
        {unread&&<i class="ui2-dot" aria-label={tr('未读','Unread')}/>}
       </button>
      );
     })}
    </div>

    <section class="ui2-chat-stream" aria-label={tr('对话内容','Chat stream')}>
     {active?(
      <>
       <header class="ui2-chat-header">
        <h4>{english?active.titleEn:active.title}</h4>
        <small>{tr('群聊回应不消耗时段与金钱（每位话题奖励 +2 好感 / +3 心情）','0-slot free chat (+2 Affinity / +3 Mood on reply)')}</small>
       </header>
       <div class="ui2-chat-messages">
        {active.messages.map((m,i)=>(
         <div key={i} class="ui2-chat-row" style={{'--poster-color':characterPosters[m.speaker]?.themeColor??'#8b673c'}}>
          <img src={`./art/ai-village/portraits/${m.speaker}.png`} alt=""/>
          <div class="ui2-chat-bubble">
           <b>{names[m.speaker]??m.speaker}</b>
           <p>{english?m.en:m.zh}</p>
          </div>
         </div>
        ))}
        {typing&&<div class="ui2-chat-typing"><span>{tr('对方正在输入…','Typing…')}</span></div>}
        {chosen&&(
         <>
          <div class="ui2-chat-row is-self">
           <div class="ui2-chat-bubble is-self">
            <b>{tr('创始人','Founder')}</b>
            <p>{english?chosen.labelEn:chosen.label}</p>
           </div>
          </div>
          <div class="ui2-chat-row" style={{'--poster-color':characterPosters[chosen.targetActor]?.themeColor??'#8b673c'}}>
           <img src={`./art/ai-village/portraits/${chosen.targetActor}.png`} alt=""/>
           <div class="ui2-chat-bubble">
            <b>{names[chosen.targetActor]??chosen.targetActor} <em class="is-up">+{tr('好感','Aff')} 2</em></b>
            <p>{english?chosen.responseEn:chosen.responseZh}</p>
           </div>
          </div>
         </>
        )}
       </div>
       <footer class="ui2-chat-replies">
        {active.chosenReply===null?(
         active.replies.map((r,idx)=>(
          <button key={idx} class="primary" disabled={locked} onClick={()=>onReply(active.id,idx)}>
           <Icon name="chat"/>
           <span>{english?r.labelEn:r.label}</span>
          </button>
         ))
        ):(
         <small class="ui2-muted-note"><Icon name="check"/> {tr('你已回应本条工坊群聊。','You already replied to this studio thread.')}</small>
        )}
       </footer>
      </>
     ):(
      <p class="ui2-muted-note">{tr('选择一条话题开始聊天。','Select a thread to read messages.')}</p>
     )}
    </section>
   </div>
  </Dialog>
 );
}
