import {useState,useEffect,useRef} from 'preact/hooks';
import {officeCommand,officeCost,slotZone} from 'oot-core';
import type {OfficeFocus} from './office-scene-spec.js';
import type {Furniture} from 'oot-core';
import type {GameView,GameSession} from 'oot-platform';
import {slotPoint,officeCamera} from './office-scene-spec.js';
import {resolveFurniturePreviewUrl} from './art/furniture-rig.js';
import {Icon} from './icons.js';

export function readableSlotLabel(slot:string,english:boolean):string{
 const match=/^(work|meeting|lounge|server)-(\d+)$/.exec(slot);
 if(!match)return slot;
 const labels:Record<string,[string,string]>={work:['工位','Station'],meeting:['会议席','Meeting'],lounge:['休闲位','Lounge'],server:['机柜位','Server']};
 return `${labels[match[1]!]![english?1:0]} ${match[2]}`;
}

export const officeErrors:Record<string,[string,string]>={NO_WORKSTATION:['电脑工位不足，请补购工位或减少电脑岗位。','Not enough computer stations. Buy one or reduce computer roles.'],NO_MEETING_SEAT:['会议席位不足，请放置白板或减少会议岗位。','Not enough meeting seats. Place a whiteboard or reduce meeting roles.'],FURNITURE_IN_USE:['该设施正在被任务使用，验收或结束任务后再调整。','This facility is reserved by a job. Finish the job before changing it.'],OFFICE_CONFLICT:['布局已变化，请退出后重新打开。','Layout changed. Close and reopen the editor.'],OFFICE_NO_CHANGES:['布局没有变化。','The layout is unchanged.'],INVALID_OFFICE_SLOT:['家具与槽位类型不匹配。','Furniture does not fit this slot.'],SLOT_OCCUPIED:['该槽位已占用，请交换位置或先收回家具。','This slot is occupied. Swap positions or store the item first.'],INSUFFICIENT_CASH:['现金不足，请减少采购。','Not enough cash. Reduce purchases.'],USE_OFFICE_LAYOUT:['请在布置办公室中管理工位。','Manage stations in Arrange office.'],OfficeArranged:['办公室布置已保存。','Office layout saved.']};

export function OfficeEditor({view,session,english,send,onPreview,close}:{view:GameView;session:GameSession;english:boolean;send:(c:ReturnType<typeof officeCommand>)=>Promise<boolean>;onPreview:(items:Furniture[],camera:OfficeFocus)=>void;close:()=>void}){
 const original=view.office!,tr=(zh:string,en:string)=>english?en:zh;
 const [items,setItems]=useState(()=>original.items.map(i=>({...i})));
 const [selected,setSelected]=useState(original.items[0]?.id??'');
 const [drawerTab,setDrawerTab]=useState<'owned'|'catalog'>('owned');
 const [zone,setZone]=useState('work'),[saving,setSaving]=useState(false),[error,setError]=useState(''),[toolsOpen,setToolsOpen]=useState(true);
 const root=useRef<HTMLElement>(null),[viewport,setViewport]=useState({width:innerWidth,height:innerHeight});
 useEffect(()=>{const observer=new ResizeObserver(entries=>{const r=entries[0]?.contentRect;if(r)setViewport({width:r.width,height:r.height});});if(root.current)observer.observe(root.current);return()=>observer.disconnect();},[]);
 const focusSlot=items.find(i=>i.id===selected)?.slot??'work-1',camera=viewport.width>=900?null:slotPoint(focusSlot,view.campaign!.chapter),cam=officeCamera(viewport.width,viewport.height,'overview',camera);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;root.current?.querySelector<HTMLButtonElement>('button')?.focus();return()=>previous?.isConnected&&previous.focus();},[]);
 const quote=session.previewOffice(officeCommand(items,original.revision)),cost=officeCost(items,original.items,original.catalog),item=items.find(i=>i.id===selected),def=original.catalog.find(d=>d.id===item?.kind),reserved=(id:string)=>Object.values(original.reservations).some(r=>r.item===id);
 useEffect(()=>onPreview(items,camera),[items,focusSlot,viewport.width]);

 const move=(slot:string|null)=>{if(!item)return;if(reserved(item.id)){setError('FURNITURE_IN_USE');return;}const other=items.find(i=>i.slot===slot&&slot!==null);if(other&&reserved(other.id)){setError('FURNITURE_IN_USE');return;}if(slot&&slotZone(slot)!==def?.zone){setError('INVALID_OFFICE_SLOT');return;}setError('');setItems(prev=>prev.map(i=>i.id===item.id?{...i,slot}:i.id===other?.id?{...i,slot:item.slot}:i));};
 const preset=(reverse:boolean)=>{const next=items.map(i=>({...i}));for(const z of ['work','meeting','lounge','server']){const free=original.slots.filter(s=>slotZone(s)===z&&!items.some(i=>i.slot===s&&reserved(i.id)));if(reverse)free.reverse();let n=0;for(const i of next.filter(i=>!reserved(i.id)&&i.slot&&original.catalog.find(d=>d.id===i.kind)?.zone===z))i.slot=free[n++]??null;}setItems(next);setError('');};

 const workCount=items.filter(i=>i.slot?.startsWith('work')).length,workMax=original.slots.filter(s=>s.startsWith('work')).length;
 const meetCount=items.filter(i=>i.slot?.startsWith('meeting')).length,meetMax=original.slots.filter(s=>s.startsWith('meeting')).length;
 const kindBadge=(kind:string)=>kind==='standard'?tr('✦ 标准+10%','✦ +10%'):kind==='basic'?tr('Ⅰ 基础','Ⅰ Base'):tr(({whiteboard:'会议',coffee:'休闲',sofa:'休闲',server:'机柜'} as Record<string,string>)[kind]??kind,kind);

 return (
  <section ref={root} class="office-editor ui2-office-editor" role="dialog" aria-modal="true" aria-label={tr('布置办公室','Arrange office')} onKeyDown={e=>{if(e.key==='Escape'&&!saving)close();if(e.key==='Tab'){const nodes=Array.from(root.current!.querySelectorAll<HTMLElement>('button:not(:disabled),select,[tabindex="0"]')).filter(n=>n.getClientRects().length>0),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}>
   <header class="ui2-editor-head">
    <div>
     <h2><Icon name="decor"/> {tr('布置办公室','Arrange office')}</h2>
     <p>{tr('草稿模式 · 时间已暂停 · 取消不收费','Draft · Time paused · Cancel is free')}</p>
    </div>
    <div class="ui2-editor-meters">
     <span>{tr('工位','Stations')} {workCount}/{workMax}</span>
     <span>{tr('会议','Meet')} {meetCount}/{meetMax}</span>
     <strong>¥{view.cash} − ¥{cost} = ¥{view.cash-cost}</strong>
    </div>
    <div class="button-row">
     <button aria-expanded={toolsOpen} onClick={()=>setToolsOpen(!toolsOpen)}>{toolsOpen?tr('收起抽屉','Hide drawer'):tr('展开抽屉','Show drawer')}</button>
     <button disabled={saving} onClick={close}>{tr('取消','Cancel')}</button>
     <button class="primary" disabled={saving||!!quote.error} onClick={()=>{setSaving(true);void send(officeCommand(items,original.revision)).then(ok=>{setSaving(false);if(ok)close();else setError('OFFICE_CONFLICT');});}}>{tr('保存布置','Save layout')}</button>
    </div>
   </header>

   <div class="office-plan">
    <div class="office-plan-toolbar">
     <b>{tr('点选下方家具后，点击高亮相容槽位即可放置或交换','Select furniture below, then tap a highlighted matching slot to place or swap')}</b>
     <button onClick={()=>preset(false)}>{tr('标准预设','Standard preset')}</button>
     <button onClick={()=>preset(true)}>{tr('镜像预设','Mirrored preset')}</button>
    </div>
    <svg viewBox={`${-cam.x/cam.scale} ${-cam.y/cam.scale} ${viewport.width/cam.scale} ${viewport.height/cam.scale}`} role="group" aria-label={tr('办公室槽位平面图','Office slot plan')}>
     {original.slots.map(slot=>{
      const p=slotPoint(slot,view.campaign!.chapter),occupant=items.find(i=>i.slot===slot),d=original.catalog.find(d=>d.id===occupant?.kind),active=occupant?.id===selected;
      const compatible=!def||slotZone(slot)===def.zone;
      const tier=occupant?.kind==='standard'?' ✦+10%':occupant?.kind==='basic'?' · Ⅰ':'';
      return <g key={slot} role="button" {...{tabindex:0}} opacity={compatible?1:0.32} aria-label={`${readableSlotLabel(slot,english)} ${d?tr(d.name,d.nameEn):tr('空位','Empty')}`} onClick={e=>{e.currentTarget.focus();move(slot);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();move(slot);}}}>
       <rect x={p.x-98} y={p.y-102} width="196" height="100" rx="14" fill={active?'#f7d58e66':compatible?'#fff4dc33':'#2b211a18'} stroke={active?'#f5cf82':compatible?'#e2b96e':'#7a6854'} stroke-width={active?'3.2':'2'} stroke-dasharray={occupant?'none':'7 5'}/>
       <rect x={p.x-76} y={p.y-28} width="152" height="24" rx="12" fill="#2e231be6" stroke={active?'#f5cf82':'#b8955e'} stroke-width="1.2"/>
       <text x={p.x} y={p.y-11} text-anchor="middle" font-size="14" font-weight="600" fill="#fff7ea">{readableSlotLabel(slot,english)}{tier}{occupant&&reserved(occupant.id)?' [锁]':''}</text>
      </g>;
     })}
    </svg>
    <label>{tr('可访问的槽位选择','Accessible slot selection')}<select value={item?.slot??''} onChange={e=>move(e.currentTarget.value||null)}><option value="">{tr('收回仓库','Store in inventory')}</option>{original.slots.filter(s=>slotZone(s)===def?.zone).map(s=><option key={s} value={s}>{readableSlotLabel(s,english)}{items.some(i=>i.slot===s)?tr('（交换）',' (swap)'):''}</option>)}</select></label>
   </div>

   <footer hidden={!toolsOpen} class="ui2-editor-drawer">
    <div class="ui2-editor-tabs">
     <div class="ui2-hub-inner-tabs" role="tablist">
      <button role="tab" aria-selected={drawerTab==='owned'} onClick={()=>setDrawerTab('owned')}>{tr(`已拥有库存 (${items.length})`,`Owned (${items.length})`)}</button>
      <button role="tab" aria-selected={drawerTab==='catalog'} onClick={()=>setDrawerTab('catalog')}>{tr('添购新设施','Catalog')}</button>
     </div>
     <div class="button-row">
      <button disabled={!item||reserved(item.id)} onClick={()=>move(null)}>{tr('收回选中','Store selected')}</button>
      {item&&original.catalog.filter(d=>d.upgradeFrom===item.kind).map(d=><button key={d.id} class="primary" disabled={reserved(item.id)} onClick={()=>setItems(prev=>prev.map(i=>i.id===item.id?{...i,kind:d.id}:i))}>{tr('升级为','Upgrade to')} {tr(d.name,d.nameEn)} +¥{d.price-def!.price}</button>)}
      {item?.id.startsWith('new:')&&<button onClick={()=>{setItems(prev=>prev.filter(i=>i.id!==item.id));setSelected(original.items[0]!.id);requestAnimationFrame(()=>root.current?.querySelector<HTMLButtonElement>('.office-inventory button')?.focus({preventScroll:true}));}}>{tr('撤销采购','Remove')}</button>}
     </div>
    </div>

    {drawerTab==='owned'?(
     <div class="office-inventory ui2-thumb-strip">
      {items.map(i=>{
       const cat=original.catalog.find(d=>d.id===i.kind)!;
       return <button key={i.id} class="ui2-furn-card" aria-pressed={selected===i.id} onClick={()=>{setSelected(i.id);setError('');}}>
        <img src={resolveFurniturePreviewUrl(i.kind)} alt=""/>
        <span class="ui2-furn-badge">{kindBadge(i.kind)}</span>
        <b>{tr(cat.name,cat.nameEn)}</b>
        <small>{i.slot?readableSlotLabel(i.slot,english):tr('仓库中','Stored')}{reserved(i.id)?tr(' · 占用中',' · In use'):''}</small>
       </button>;
      })}
     </div>
    ):(
     <div class="ui2-catalog-row">
      <select aria-label={tr('家具分类','Furniture category')} value={zone} onChange={e=>setZone(e.currentTarget.value)}>{['work','meeting','lounge','server'].map((z,i)=><option key={z} value={z}>{tr(['工位套餐','会议设施','休闲家具','设备外壳'][i]!,['Stations','Meeting','Lounge','Equipment shells'][i]!)}</option>)}</select>
      <div class="office-inventory ui2-thumb-strip">
       {original.catalog.filter(d=>d.zone===zone).map(d=><button key={d.id} class="ui2-furn-card" onClick={()=>{const id=`new:${Math.max(-1,...items.filter(i=>i.id.startsWith('new:')).map(i=>Number(i.id.slice(4))))+1}`;const slot=original.slots.find(s=>slotZone(s)===d.zone&&!items.some(i=>i.slot===s))??null;setItems(prev=>[...prev,{id,kind:d.id,slot}]);setSelected(id);setDrawerTab('owned');setError('');}}>
        <img src={resolveFurniturePreviewUrl(d.id)} alt=""/>
        <span class="ui2-furn-badge">¥{d.price}</span>
        <b>{tr('添购','Add')} {tr(d.name,d.nameEn)}</b>
        <small>{d.efficiency?`+${Math.round(d.efficiency*100)}% ${tr('产出','output')}`:tr('扩展槽位容积','Expands capacity')}</small>
       </button>)}
      </div>
     </div>
    )}
    <p class="ui2-editor-note" role="status">{error||quote.error?tr(...(officeErrors[error||quote.error!]??[error||quote.error!,error||quote.error!])):def?.zone==='work'?tr(`选中工位：执行/负责人产出 +${Math.round((def.efficiency??0)*100)}% · 精力消耗修正 +${def.energyCost??0}`,`Selected station: +${Math.round((def.efficiency??0)*100)}% output · energy adjust +${def.energyCost??0}`):tr('基础工位消耗额外2精力；标准工位产出+10%按实际计资源；设备外壳不加算力。','Basic stations cost +2 energy; standard stations add +10% output; cabinets add no compute.')}</p>
   </footer>
  </section>
 );
}
