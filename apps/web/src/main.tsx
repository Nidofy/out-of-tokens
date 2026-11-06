import { render } from 'preact';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Command, Member } from 'oot-core';
import { BrowserSaves, GameSession, manualSlots, saveSlots } from 'oot-platform';
import type { GameView, SaveSlot, StoredSave, WritableSlot } from 'oot-platform';
import { content } from './content.js';
import { names } from './presentation.js';
import './style.css';
const skills: Record<string, string> = { code: '代码', write: '写作', reason: '推理', create: '创意', media: '多媒体', recall: '知识' };
const states: Record<string, string> = { posted: '待接单', accepted: '待派遣', working: '执行中', review: '待验收', waiting: '等待下周期', delivered: '已交付', breached: '已违约' };
const money = (n: number) => new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(n);
function explain(value: unknown) { const e = value instanceof Error ? value.message : String(value); const messages: Record<string, string> = { CRISIS_SMALL_ONLY: '危机期间只能接总工作量不超过40WP的小单。', SAVE_CONFLICT: '另一窗口已更新这个存档。为避免覆盖，请先重新载入。', SESSION_CHANGED: '载入期间会话有新操作，请重试。', STORAGE_UNAVAILABLE: '浏览器存储不可用。可以继续试玩，并导出存档文件。', STORAGE_BLOCKED: '存档升级被其他窗口占用，请关闭旧窗口后重试。', INCOMPATIBLE_SAVE: '存档版本或内容不兼容，请用对应版本打开。', HASH_MISMATCH: '存档校验失败，当前进度保持不变。', INVALID_SAVE: '无法读取这个存档。', NO_SAVE: '这个位置还没有存档。', AUTO_PAUSED: '自动存档已暂停，请先载入最新存档，或保存到手动槽。', ACTOR_BUSY: '角色正在忙碌，请换人或推进时段。', STILL_CLARIFYING: '澄清需要一个时段，请推进后再接单。', NOT_WORK_SLOT: '上午、下午才能澄清需求。', INSUFFICIENT_CASH: '现金不足，暂时无法进行这项操作。', INVALID_ROLES: '至少安排一位执行者，负责人和审查者各最多一位。', INVALID_TEAM: '请先选择参与委托的角色。', REWORK_AVAILABLE: '质量未达标，可以在期限内返工一次。', LOAN_LIMIT: '已达到贷款上限。', INVALID_REPAYMENT: '还款不能超过贷款本金或当前现金。', NOT_READY: '委托还没有执行完成。', PENDING_CHOICE: '请先处理当前事件。', BANKRUPT: '工作室已经破产，可以选择继承重开。', NOT_LIFE_SLOT: '只有晚上和深夜可以安排加班。', NO_ACTIVE_ACTOR: '角色需要有在制委托和足够精力才能加班。', ALREADY_OVERTIME: '本时段已经安排过加班。', INVALID_SAVE_SIZE: '存档文件为空或超过8MB。', SECURE_CONTEXT_REQUIRED: '请在本机localhost或HTTPS环境打开游戏。' }; return messages[e] ?? `操作未完成：${e}`; }
function Modal({ open, title, onClose, children, required = false, feedback }: {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ComponentChildren;
    required?: boolean;
    feedback?: string;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const d = ref.current;
        if (open && !d?.open)
            d?.showModal();
        if (!open && d?.open)
            d.close();
    }, [open]);
    return <dialog ref={ref} aria-label={title} onCancel={e => {
            e.preventDefault();
            if (!required)
                onClose();
        }}><div class="dialog-head"><div><span class="eyebrow">OUT OF TOKENS</span><h2>{title}</h2></div>{!required && <button class="icon-button" onClick={onClose} aria-label="关闭">×</button>}</div>{feedback && <p class="notice" role="status">{feedback}</p>}{children}</dialog>;
}
function Workshop({ view, onSelect }: {
    view: GameView;
    onSelect: (id: string) => void;
}) {
    const host = useRef<HTMLDivElement>(null), scene = useRef<Awaited<ReturnType<typeof import('./scene.js')['createWorkshop']>> | null>(null), latest = useRef(view), click = useRef(onSelect);
    const [failed, setFailed] = useState(false);
    latest.current = view;
    click.current = onSelect;
    useEffect(() => {
        let disposed = false;
        void import('./scene.js').then(m => m.createWorkshop(host.current!, id => click.current(id))).then(s => {
            if (disposed) {
                s.destroy();
                return;
            }
            scene.current = s;
            s.update(latest.current);
        }).catch(() => {
            if (!disposed)
                setFailed(true);
        });
        return () => { disposed = true; scene.current?.destroy(); scene.current = null; };
    }, []);
    useEffect(() => { scene.current?.update(view); }, [view]);
    return <div class="workshop" ref={host} role="img" aria-label="四位伙伴在温暖的车库工作室里，各自坐在工位前。下方角色卡可查看与操作。">{failed && <div class="scene-fallback"><span>☕</span><p>工作室准备好了</p><small>画面暂时不可用，下方角色和委托仍可正常操作。</small></div>}</div>;
}
type TeamForm = Record<string, {
    role: 'none' | Member['role'];
    mode: Member['mode'];
}>;
function App() {
    const [session] = useState(() => new GameSession(content, 1)), [storage] = useState(() => new BrowserSaves());
    const [view, setView] = useState(session.view), [busy, setBusy] = useState(true), [notice, setNotice] = useState('正在打开工作室…'), [error, setError] = useState(false), [tab, setTab] = useState<'posted' | 'active' | 'history'>('posted');
    const [selected, setSelected] = useState<string | null>(null), [actorId, setActorId] = useState<string | null>(null), [savesOpen, setSavesOpen] = useState(false), [records, setRecords] = useState<(StoredSave | null)[]>([]), [team, setTeam] = useState<TeamForm>({});
    const [entries, setEntries] = useState<string[]>(['开源万事屋开张了。先读委托，再安排合适的伙伴。']);
    const revisions = useRef<Partial<Record<WritableSlot, number>>>({}), autoPaused = useRef(false);
    const job = view.jobs.find(j => j.id === selected), actor = view.actors.find(a => a.id === actorId);
    const notify = (message: string, isError = false) => { setNotice(message); setError(isError); };
    useEffect(() => {
        let live = true;
        storage.onExternalChange = () => {
            if (live) {
                autoPaused.current = true;
                notify('另一窗口更新了存档；自动保存已暂停。请载入最新进度后继续。', true);
            }
        };
        void (async () => {
            try {
                const list = await storage.list();
                if (!live)
                    return;
                setRecords(list);
                for (const row of list)
                    if (row && (row.id === 'auto' || manualSlots.includes(row.id as typeof manualSlots[number])))
                        revisions.current[row.id as WritableSlot] = row.revision;
                const auto = list.find(row => row?.id === 'auto');
                if (auto) {
                    await session.importSave(auto.text);
                    if (live) {
                        setView(session.view);
                        notify('已接着上次的进度，欢迎回来。');
                    }
                }
                else
                    notify('先挑一张委托，看看需求和报酬。');
            }
            catch (e) {
                autoPaused.current = true;
                if (live)
                    notify(explain(e), true);
            }
            finally {
                if (live)
                    setBusy(false);
            }
        })();
        return () => { live = false; void storage.close().catch(() => { }); };
    }, [session, storage]);
    useEffect(() => {
        if (!job)
            return;
        setTeam(Object.fromEntries(view.actors.map(a => { const member = job.team.find(m => m.character === a.id); return [a.id, { role: member?.role ?? 'none', mode: member?.mode ?? 'cloud' }]; })));
    }, [selected]);
    async function saveTo(slot: WritableSlot) {
        if (slot === 'auto' && autoPaused.current)
            throw Error('AUTO_PAUSED');
        const text = await session.exportSave();
        revisions.current[slot] = await storage.write(slot, text, revisions.current[slot] ?? 0);
        setRecords(await storage.list());
    }
    async function perform(command: Command) {
        if (busy)
            return;
        const r = session.send(command);
        if (r.error) {
            notify(explain(r.error), true);
            return;
        }
        const next = session.view;
        setView(next);
        setEntries(old => [...old, ...r.events.map(e => e.message)].slice(-10));
        if (command.type === 'accept')
            setTab('active');
        if (command.type === 'assign') {
            setSelected(null);
            setTab('active');
        }
        if (['reject', 'deliver'].includes(command.type))
            setSelected(null);
        notify(r.events.at(-1)?.message ?? '安排好了。');
        if (r.events.some(e => e.type === 'DayEnd' || e.type === 'Restarted')) {
            setBusy(true);
            try {
                await saveTo('auto');
                notify('今天辛苦了，进度已自动保存。');
            }
            catch (e) {
                autoPaused.current = true;
                notify(explain(e), true);
            }
            finally {
                setBusy(false);
            }
        }
    }
    async function manualSave(slot: WritableSlot) {
        setBusy(true);
        try {
            await saveTo(slot);
            notify('进度已经存好。');
        }
        catch (e) {
            notify(explain(e), true);
        }
        finally {
            setBusy(false);
        }
    }
    async function loadFrom(slot: SaveSlot) {
        setBusy(true);
        try {
            const record = await storage.read(slot);
            if (!record)
                throw Error('NO_SAVE');
            const currentAuto = await storage.read('auto');
            await session.importSave(record.text);
            revisions.current.auto = currentAuto?.revision ?? 0;
            if (slot === 'auto' || manualSlots.includes(slot as typeof manualSlots[number]))
                revisions.current[slot as WritableSlot] = record.revision;
            autoPaused.current = false;
            setView(session.view);
            setSelected(null);
            setActorId(null);
            setSavesOpen(false);
            setEntries(['从存档接着开始。']);
            notify('存档已载入。');
        }
        catch (e) {
            notify(explain(e), true);
        }
        finally {
            setBusy(false);
        }
    }
    function download(text: string, name: string) { const url = URL.createObjectURL(new Blob([text], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    async function exportCurrent() {
        setBusy(true);
        try {
            download(await session.exportSave(), 'out-of-tokens-save.json');
            notify('已导出存档，可在CLI或此版本网页中继续。');
        }
        catch (e) {
            notify(explain(e), true);
        }
        finally {
            setBusy(false);
        }
    }
    async function importFile(file: File | undefined) {
        if (!file)
            return;
        setBusy(true);
        try {
            if (file.size > 8000000)
                throw Error('INVALID_SAVE_SIZE');
            let available = true;
            try {
                revisions.current.auto = (await storage.read('auto'))?.revision ?? 0;
            }
            catch {
                available = false;
            }
            await session.importSave(await file.text());
            autoPaused.current = !available;
            setView(session.view);
            setSavesOpen(false);
            setSelected(null);
            setActorId(null);
            notify(available ? '文件校验通过，进度已载入。' : '已载入文件；浏览器存储不可用，请用导出保存后续进度。', !available);
        }
        catch (e) {
            notify(explain(e), true);
        }
        finally {
            setBusy(false);
        }
    }
    const locked = busy || !!view.pending || view.bankrupt;
    const selectedTeam = Object.entries(team).filter(([, m]) => m.role !== 'none').map(([character, m]) => ({ character, role: m.role as Member['role'], mode: m.mode }));
    const preview = job && ['accepted', 'working'].includes(job.status) ? session.previewAssignment(job.id, selectedTeam) : null;
    const shown = view.jobs.filter(j => tab === 'posted' ? j.status === 'posted' : tab === 'active' ? ['accepted', 'working', 'review', 'waiting'].includes(j.status) : ['delivered', 'breached'].includes(j.status)).slice(tab === 'history' ? -30 : 0);
    const active = view.jobs.filter(j => ['accepted', 'working', 'review', 'waiting'].includes(j.status)), nextSlot = ['下午', '晚上', '深夜', '明天上午'][view.absoluteSlot % 4];
    return <div class="app-shell">
  <header class="topbar"><a class="brand" href="./" aria-label="Out of Tokens 首页"><span class="brand-symbol">ot<span>·</span></span><span>OUT OF TOKENS<small>开源万事屋</small></span></a><div class="top-links"><span class="chapter-chip">第 0 章 · 从车库开始</span><button class="quiet" disabled={busy} onClick={() => { setSavesOpen(true); void storage.list().then(setRecords).catch(e => notify(explain(e), true)); }}>存档与备份 <span>↗</span></button></div></header>
  <main>
   <section class="intro"><div><div class="eyebrow">A LITTLE STUDIO, BIG IDEAS</div><h1>今天，也一起好好开工。</h1><p>读懂需求，把合适的工作交给合适的伙伴。</p></div><div class="day-card"><span>第 <strong>{view.day}</strong> 天</span><span class="sun">{view.absoluteSlot % 4 < 2 ? '☀' : '☾'}</span><b>{view.slot}</b></div></section>
   <section class="dashboard" aria-label="工作室资源"><article><span class="stat-icon">¥</span><div><small>工作室现金</small><strong class={view.cash < 0 ? 'negative' : ''}>¥ {money(view.cash)}</strong><span>下次周结预计 ¥{money(view.nextWeeklyBill)}</span></div></article><article><span class="stat-icon token">T</span><div><small>今日云额度</small><strong>{money(view.quota)} <em>T</em><i>＋{money(view.purchased)} 购额</i></strong><span>每日刷新 · 本地算力 {view.localCapacity} / 时段</span></div></article><article><span class="stat-icon plant">↗</span><div><small>车库的第一个目标</small><strong>{view.debtDue ? `还清 ¥${money(view.debtDue)}` : '旧债已结算'}<em>{view.debtDue ? ' 欠费' : ''}</em></strong><span>{view.debtDue ? `还剩 ${Math.max(0, view.debtSlot - view.absoluteSlot)} 个时段` : `当前${view.cash >= 0 ? '现金非负' : '仍有现金流缺口'}`} · 声望 {view.reputation}</span></div></article></section>
   <div class={`notice ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}><span>{error ? '!' : '✦'}</span>{notice}</div>
   <div class="workspace-grid"><section class="studio-column">
    <div class="section-heading"><div><span class="eyebrow">THE GARAGE</span><h2>我们的工作室 <span class="small-tag">{view.actors.length} 位伙伴</span></h2></div><span class="live-dot">{active.length} 单进行中</span></div>
    <div class="scene-card"><Workshop view={view} onSelect={setActorId}/><div class="scene-caption"><span>☕ 窗边的位置，今天也有阳光。</span><small>点击伙伴，看看他们的状态</small></div></div>
    <div class="actor-grid">{view.actors.map(a => <button class={`actor-card ${a.busy ? 'occupied' : ''}`} onClick={() => setActorId(a.id)} key={a.id}><span class={`avatar ${a.id}`}>{(names[a.id] ?? a.id).slice(0, 1)}</span><span class="actor-info"><b>{names[a.id] ?? a.id}</b><small>{a.busy ? '有安排' : '可以接活'} · 精力 {a.energy}</small><span class="energy-track"><span style={{ width: `${a.energy}%` }}/></span></span><span class="chevron">›</span></button>)}</div>
    <div class="time-controls"><div><strong>{view.absoluteSlot % 4 < 2 ? '安排好了，就开始吧。' : '休息也是工作的一部分。'}</strong><small>{view.absoluteSlot % 4 < 2 ? '推进一个时段，伙伴会执行当前委托。' : '默认休息；有在制委托的伙伴可以选择加班。'}</small></div><button class="primary" disabled={locked} onClick={() => void perform({ type: 'advance' })}>前往{nextSlot} <span>→</span></button></div>
    <details class="finance-tools"><summary>补充资源与贷款 <span>＋</span></summary><p>贷款本金 ¥{money(view.loan)} · 本周已累计本地电费 ¥{money(view.electricity)}</p><div class="button-row"><button disabled={locked} onClick={() => void perform({ type: 'buy', amount: 100 })}>买 100T · ¥50</button><button disabled={locked} onClick={() => void perform({ type: 'loan', amount: 1000 })}>借款 ¥1,000</button><button disabled={locked || view.loan === 0 || view.cash <= 0} onClick={() => void perform({ type: 'repay', amount: Math.min(1000, view.loan) })}>偿还 ¥{money(Math.min(1000, view.loan))}</button></div><small>临购额度跨日保留；贷款周息 5%，上限 ¥5,000。</small></details>
    {view.bankrupt && <section class="bankrupt"><h2>先喘口气，再重新出发。</h2><p>这间工作室暂时撑不下去了。图鉴和创始人经验会留下来。</p><button class="primary" disabled={busy} onClick={() => void perform({ type: 'restart' })}>继承重开</button></section>}
    <details class="journal"><summary>工作室手记 <span>最近的经营记录</span></summary><ol>{entries.map((e, i) => <li key={i}>{e}</li>)}</ol></details>
   </section><aside class="board-column"><div class="section-heading"><div><span class="eyebrow">LITTLE JOBS, REAL POSSIBILITIES</span><h2>委托板</h2></div><span class="board-count">{shown.length.toString().padStart(2, '0')}</span></div><div class="tabs" role="tablist" aria-label="委托分类">{([['posted', '待接委托'], ['active', '进行中'], ['history', '已结束']] as const).map(([id, label]) => <button role="tab" aria-selected={tab === id} class={tab === id ? 'selected' : ''} onClick={() => setTab(id)}>{label}</button>)}</div><div class="jobs">{shown.length ? shown.map(j => <button class={`job-card ${j.status === 'review' ? 'ready' : ''}`} onClick={() => setSelected(j.id)} key={j.id}><div class="job-meta"><span>{j.delivery === 'multi' ? '多轮协作' : j.delivery === 'retainer' ? '长期合同' : '一次委托'}</span><span class={j.overdue ? 'negative' : ''}>{j.overdue ? '已逾期' : states[j.status]}</span></div><h3>{j.title}</h3><p>{j.description}</p><div class="job-tags">{Object.entries(j.weights).filter(([, w]) => w > 0).map(([k, w]) => <span>{skills[k]} {Math.round(w * 100)}%</span>)}{j.hidden > 0 && <span class="hidden-tag">{j.hidden} 条待澄清</span>}</div>{j.status !== 'posted' && <div class="progress"><span style={{ width: `${Math.min(100, j.progress / j.work * 100)}%` }}/></div>}<div class="job-bottom"><strong>¥{money(j.reward)}<small>{j.phases > 1 ? ' / 阶段' : ''}</small></strong><span>{j.status === 'posted' ? `${j.workSlots} 个工作时段` : `${j.progress}/${j.work} WP`} <b>↗</b></span></div></button>) : <div class="empty"><span>⌁</span><h3>{tab === 'active' ? '还没有正在进行的委托' : '这里暂时空空的'}</h3><p>{tab === 'active' ? '从委托板挑一单，再给伙伴安排岗位。' : '新的一天会带来新的机会。'}</p></div>}</div><div class="board-note">✧ 不必接下所有委托。给团队留一点余地。</div></aside></div>
  </main><footer><span>OUT OF TOKENS <i>·</i> 小小工作室，慢慢变好。</span><span>本机存档 · 游戏 Token 不消耗真实 API 额度</span></footer>
  <Modal feedback={notice} open={!!job} title={job?.title ?? '委托详情'} onClose={() => setSelected(null)}>{job && <><p class="muted">{job.description}</p><div class="detail-summary"><span>每阶段报酬 <b>¥{money(job.reward)}</b></span><span>阶段 <b>{job.phase + 1}/{job.phases}</b></span><span>质量线 <b>{job.qualityLines.join(' / ')}</b></span><span>需求清晰度 <b>{job.clarity}%</b></span></div><div class="job-tags">{Object.entries(job.weights).filter(([, w]) => w > 0).map(([k, w]) => <span>{skills[k]} {Math.round(w * 100)}%</span>)}</div><p>进度 {job.progress}/{job.work} WP · {job.status === 'posted' ? `接单后 ${job.workSlots} 个工作时段` : `绝对时段 ${job.deadline} 截止`} · 隐藏需求 {job.hidden} 条</p>
   {job.status === 'posted' ? <><div class="clarify-box"><h3>先聊清楚，再开工</h3><p>每位伙伴花一个工作时段揭示一条需求。澄清结束后才能接单。</p><div class="button-row">{view.actors.map(a => <button disabled={locked || a.busy || a.energy < 15 || job.hidden === 0 || view.absoluteSlot % 4 >= 2} onClick={() => void perform({ type: 'clarify', job: job.id, character: a.id })}>让 {names[a.id]} 澄清</button>)}</div></div><div class="dialog-actions"><button disabled={locked} onClick={() => void perform({ type: 'reject', job: job.id })}>这次先放过</button><button class="primary" disabled={locked || job.clarifyingUntil > view.absoluteSlot} onClick={() => void perform({ type: 'accept', job: job.id })}>接下委托 · 预付30%</button></div></> : null}
   {['accepted', 'working'].includes(job.status) && <><h3>安排团队</h3><p class="muted">至少一位执行者；负责人半速产出并加速团队，审查者处理缺陷与质量。</p><div class="team-form">{view.actors.map(a => <div class="team-row"><div><b>{names[a.id]}</b><small>{a.price} T/WP · 精力 {a.energy}</small></div><select aria-label={`${names[a.id]}岗位`} value={team[a.id]?.role ?? 'none'} disabled={locked || (a.busy && !job.team.some(m => m.character === a.id))} onChange={e => setTeam({ ...team, [a.id]: { mode: team[a.id]?.mode ?? 'cloud', role: e.currentTarget.value as 'none' | Member['role'] } })}><option value="none">不参与</option><option value="worker">执行</option><option value="planner">负责人</option><option value="reviewer">审查</option></select><select aria-label={`${names[a.id]}部署`} value={team[a.id]?.mode ?? 'cloud'} disabled={locked} onChange={e => setTeam({ ...team, [a.id]: { role: team[a.id]?.role ?? 'none', mode: e.currentTarget.value as Member['mode'] } })}><option value="cloud">云端</option><option value="local">本地</option></select></div>)}</div><p class="resource-hint">所选团队用量估计：云 {preview?.estimate?.cloud ?? '—'}T / 本地 {preview?.estimate?.local ?? '—'}。共享资源按委托顺序、负责人→执行→审查、同岗角色ID分配。</p><div class="dialog-actions"><button class="primary" disabled={locked} onClick={() => void perform({ type: 'assign', job: job.id, team: Object.entries(team).filter(([, m]) => m.role !== 'none').map(([character, m]) => ({ character, role: m.role as Member['role'], mode: m.mode })) })}>确认派遣 →</button></div></>}
   {job.status === 'review' && <><div class="quality-result"><strong>{job.quality}</strong><span>本阶段质量 · 及格线 {job.passQuality}</span></div><p class="muted">基础 {job.qualityBreakdown.base} ＋审查 {job.qualityBreakdown.review} ＋事件 {job.qualityBreakdown.event} −隐藏需求 {job.qualityBreakdown.hiddenPenalty} −缺陷 {job.qualityBreakdown.defectPenalty}，另含种子波动。</p><div class="dialog-actions"><button disabled={locked || job.reworked || job.quality >= job.passQuality || view.absoluteSlot > job.deadline} onClick={() => void perform({ type: 'rework', job: job.id })}>再打磨一次</button><button class="primary" disabled={locked || (job.quality < job.passQuality && !job.reworked && view.absoluteSlot <= job.deadline)} onClick={() => void perform({ type: 'deliver', job: job.id })}>{job.quality < job.passQuality ? '结算违约' : '提交验收'}</button></div></>}
   {job.status === 'waiting' && <p class="clarify-box">下一阶段在绝对时段 {job.resumeAt} 开始，团队继续保留，不产生工作费用。</p>}
  </>}</Modal>
  <Modal feedback={notice} open={!!actor} title={actor ? names[actor.id] ?? actor.id : '伙伴'} onClose={() => setActorId(null)}>{actor && <><div class={`large-avatar avatar ${actor.id}`}>{(names[actor.id] ?? actor.id)[0]}</div><div class="detail-summary"><span>精力 <b>{actor.energy}</b></span><span>心情 <b>{actor.mood}</b></span><span>上下文负载 <b>{actor.load}</b></span><span>单价 <b>{actor.price} T/WP</b></span></div><div class="skill-list">{Object.entries(actor.skills).map(([key, value]) => <div><span>{skills[key]}</span><meter min={0} max={10} value={value}/><b>{value}</b></div>)}</div><p class="muted">{actor.busy ? '已经有安排。可在进行中的委托里调整岗位。' : '现在有空，看看哪份工作适合这位伙伴。'}</p><div class="dialog-actions"><button disabled={locked || view.absoluteSlot % 4 < 2} onClick={() => void perform({ type: 'overtime', character: actor.id })}>安排本时段加班</button><button class="primary" onClick={() => setActorId(null)}>回到工作室</button></div></>}</Modal>
  <Modal feedback={notice} open={savesOpen} title="把今天，好好存起来" onClose={() => setSavesOpen(false)}><p class="muted">3个手动位置。每天结束自动保存，并保留此前5份自动档。存档只保存在这台浏览器中。</p><div class="save-list">{saveSlots.map(id => { const row = records.find(r => r?.id === id), writable = manualSlots.includes(id as typeof manualSlots[number]); return <div class="save-row"><div><b>{writable ? `手动存档 ${id.at(-1)}` : id === 'auto' ? '最近自动存档' : `自动备份 ${id.at(-1)}`}</b><small>{row ? new Date(row.savedAt).toLocaleString('zh-CN') : '还没有存档'}</small></div><div>{writable && <button disabled={busy} onClick={() => void manualSave(id as WritableSlot)}>保存</button>}<button disabled={busy || !row} onClick={() => void loadFrom(id)}>载入</button>{row && <button disabled={busy} onClick={() => download(row.text, `out-of-tokens-${id}.json`)} aria-label={`导出${id}`}>↓</button>}</div></div>; })}</div><div class="dialog-actions"><label class={`file-button ${busy ? 'disabled' : ''}`}>导入文件<input type="file" accept="application/json,.json" disabled={busy} onChange={e => { void importFile(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }}/></label><button class="primary" disabled={busy} onClick={() => void exportCurrent()}>导出当前进度</button></div></Modal>
  <Modal feedback={notice} open={!!view.pending} title={view.pending?.title ?? '工作室事件'} required onClose={() => { }}><p class="muted">工作中遇到了一点小插曲。做个选择，伙伴们就会继续。</p><div class="event-options">{view.pending?.choices.map((choice, index) => <button disabled={busy || (choice.cost > 0 && choice.cost > view.cash)} onClick={() => void perform({ type: 'choose', index })}><b>{choice.label}</b><span>{choice.cost ? `¥${choice.cost}` : '无需现金'} · 本时段产出 ×{choice.multiplier}</span>{choice.effects?.length ? <small>{choice.effects.map(e => `${({ quality: '质量变化', defects: '缺陷变化', work: '工作量变化', mood: '心情变化', compact: '上下文保留比例', tokenRate: '资源消耗倍率', cashPercent: '现金损失比例', reset: '重置进度' } as const)[e.kind]} ${e.value}`).join(' · ')}</small> : null}<i>→</i></button>)}</div></Modal>
 </div>;
}
render(<App />, document.getElementById('app')!);
