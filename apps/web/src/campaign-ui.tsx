import type { Command } from 'oot-core';
import type { GameView } from 'oot-platform';
import { names } from './presentation.js';
export const sceneNames = { workshop: '工作室', canteen: '食堂', library: '图书馆' };
type Props = { view: GameView; send: (c: Command) => void; locked: boolean };
export function CampaignPanel({ view, send, locked }: Props) {
    const p = view.campaign, catalog = view.catalog;
    if (!p || !catalog) return null;
    const action = (action: Extract<Command, {type:'campaign'}>['action'], id: string) => send({ type: 'campaign', action, id });
    return <section class="campaign-panel" aria-label="生活与成长">
        <nav class="button-row" aria-label="场景">{Object.entries(sceneNames).map(([id, name]) => <button disabled={locked} aria-pressed={p.scene === id} class={p.scene === id ? 'selected' : ''} onClick={() => action('visit', id)}>{name}</button>)}</nav>
        <p>这里是{sceneNames[p.scene]}。{view.actors.filter(a => a.location === p.scene).map(a => names[a.id]).join('、') || '伙伴们都在别处'}。</p>
        <details><summary>找人 · 今日去向</summary>{view.actors.map(a => <p key={a.id}>{names[a.id]}：{sceneNames[a.location]} <button disabled={locked} onClick={() => action('visit', a.location)}>去找他</button></p>)}</details>
        <details open><summary>第 0 章 · 开源车库联盟</summary><p>{p.chapterZero === 'passed' ? '第14天偿付快照达成！' : p.chapterZero === 'missed' ? '第14天未达到净偿付目标。可以继续经营，或破产后继承重开。' : `在第14天结算欠费后，净偿付资金须≥0，并至少完成一次交付。还剩${Math.max(0,56-view.absoluteSlot)}槽。`}</p><ol><li>读委托的工作量、质量线和角色技能，接单后派遣。</li><li>小白甲方先澄清；本地执行省云额度，但周结收电费。</li><li>晚上去食堂/图书馆找人，聊天、吃饭或学习；每人每槽一次活动。</li><li>日结刷新配额；每7天付账，借款仍计入负债。</li></ol><small>经营平衡仍在整改。此构建用于工程试玩，尚未通过10人试玩验收。</small></details>
        <details><summary>招募与研发 · {p.research} 研发点</summary>{catalog.recruits.filter(r => !view.actors.some(a => a.id === r.character)).map(r => <p key={r.character}>{names[r.character]} · 声望{r.reputation} / ¥{r.cost} <button disabled={locked || view.reputation < r.reputation || view.cash < r.cost} onClick={() => action('recruit', r.character)}>邀请加入</button></p>)}<p>去图书馆学习可获得研发点。高级版本用更多Token换不同专长；解锁不等于切换。</p></details>
        <details><summary>硬件与软件</summary><div class="upgrade-list">{Object.entries(p.hardware).map(([id, level]) => <p key={id}>{({office:'办公环境：产能',compute:'本地算力',storage:'上下文存储',network:'网络队列'} as Record<string,string>)[id]} Lv.{level} <button disabled={locked || level >= catalog.maxHardware} onClick={() => action('hardware',id)}>{level < catalog.maxHardware ? `升级 ¥${[600,1800,4500,10000,24000][level]}` : '满级'}</button></p>)}{catalog.software.map(u => <p key={u.id}>{u.name} · ¥{u.cost} / {u.research} RP <button disabled={locked || p.software.includes(u.id)} onClick={() => action('software',u.id)}>{p.software.includes(u.id) ? '已安装' : '研发'}</button></p>)}</div></details>
    </section>;
}
export function ActorLife({ view, id, send, locked }: Props & {id:string}) {
    const p=view.campaign, a=view.actors.find(a=>a.id===id), r=p?.relations[id];
    if(!p||!a||!r) return null;
    const act=(action: Extract<Command,{type:'campaign'}>['action'],target?:string)=>send({type:'campaign',action,id,...(target?{target}:{})});
    return <div class="actor-life"><p>在{sceneNames[a.location]} · 好感 {r.affinity}/100 · 经验 {r.xp} · {r.training ? `训练至时段${r.training.until}` : '没有训练安排'}</p><div class="button-row">{([['chat','聊天 +3好感'],['gift','送礼 ¥60'],['meal','吃饭 ¥30'],['study','学习 +2RP'],['recall','面对面召回']] as const).map(([action,label])=><button disabled={locked} onClick={()=>act(action)}>{label}</button>)}</div><p>要先到同一场景。工作时段已派遣的伙伴不能分心，训练中的伙伴不能被派遣。</p><h3>版本</h3>{view.catalog?.versions.filter(v=>v.character===id).map(v=><p key={v.id}>{v.name} · {v.price}T/WP · 速度{v.speed} <button disabled={locked || a.version===v.id} onClick={()=>p.unlocked.includes(v.id)?act('switch',v.id):send({type:'campaign',action:'unlock',id:v.id})}>{a.version===v.id?'当前版本':p.unlocked.includes(v.id)?'切换':'研发 ¥600 / 10RP'}</button></p>)}<details><summary>开源训练</summary><p>微调¥300/5RP，8槽；每版本共2次，每次指定技能+1。对齐4槽，稳定性+1，每版本一次。</p><div class="button-row">{(['code','write','reason','create','media','recall'] as const).map(k=><button disabled={locked} onClick={()=>act('train',k)}>训练 {k}</button>)}<button disabled={locked} onClick={()=>act('align')}>对齐</button></div></details></div>;
}
