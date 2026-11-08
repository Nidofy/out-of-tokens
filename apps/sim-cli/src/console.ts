import { getViewModel } from 'oot-core';
import type { Content, State } from 'oot-core';
export const help = `status | advance | accept/reject/deliver/rework JOB
clarify JOB ACTOR | assign JOB ACTOR:worker:cloud ACTOR:reviewer:local
choose INDEX（从0开始）| buy T | loan 金额 | repay 金额 | overtime ACTOR | restart | save | load | quit
查看委托及权重→澄清或拒绝→接受→派遣→advance→选择事件→交付/返工。
澄清占角色一个时段。上午/下午工作，晚间/深夜休息；期限使用绝对时段。
云额度每天刷新，临时购额保留；本地算力每槽重置、按用量周结电费。`;
export function parseLine(line: string): unknown {
    if (line.trim().startsWith('{'))
        return JSON.parse(line);
    const [type, ...args] = line.trim().split(/\s+/);
    const arity: Record<string, number> = { restart: 0, overtime: 1, loan: 1, repay: 1, advance: 0, accept: 1, reject: 1, deliver: 1, rework: 1, clarify: 2, choose: 1, buy: 1 };
    if (type === 'assign') {
        if (args.length < 2 || args.length > 5)
            throw Error('用法：assign JOB ACTOR:ROLE:MODE ...');
        return { type, job: args[0], team: args.slice(1).map(x => {
                const parts = x.split(':');
                if (parts.length > 3 || parts.some(p => !p))
                    throw Error('角色格式错误');
                const [character, role = 'worker', mode = 'cloud'] = parts;
                return { character, role, mode };
            }) };
    }
    if (!type || !(type in arity))
        throw Error('未知命令，输入 help 查看命令');
    if (args.length !== arity[type])
        throw Error('参数数量错误，输入 help 查看用法');
    if (type === 'overtime')
        return { type, character: args[0] };
    if (type === 'advance' || type === 'restart')
        return { type };
    if (type === 'choose' || type === 'buy' || type === 'loan' || type === 'repay') {
        if (!/^\d+$/.test(args[0]!))
            throw Error('请输入非负整数');
        return type === 'choose' ? { type, index: Number(args[0]) } : { type, amount: Number(args[0]) };
    }
    return type === 'clarify' ? { type, job: args[0], character: args[1] } : { type, job: args[0] };
}
export function render(s: State, c: Content): string {
    const v = getViewModel(s, c);
    const lines = [`第${v.day}天 ${v.slot} / 绝对时段${v.absoluteSlot} | 资金¥${v.cash} | 云${v.quota}T + 购额${v.purchased}T | 本地${v.localCapacity}/槽`,
        `下次周结预计¥${v.nextWeeklyBill} | 贷款本金¥${v.loan} | 危机${v.crises}次 | 声望${v.reputation} | 旧债¥${v.debtDue}（时段${v.debtSlot}到期）${v.bankrupt ? ' | 已破产，可restart继承重开' : v.crisisSince !== null ? ' | 现金流危机' : ''}`];
    for (const a of v.actors)
        lines.push(`${a.id} ${a.busy ? '占用' : '空闲'} 精力${a.energy} 心情${a.mood} 上下文${a.load} 单价${a.price}T/WP 能力${JSON.stringify(a.skills)}`);
    for (const j of v.jobs.filter(j => !['delivered', 'breached'].includes(j.status)).concat(v.jobs.filter(j => ['delivered', 'breached'].includes(j.status)).slice(-3))) {
        lines.push(`[${j.id}] ${j.title} (${j.status}${j.overdue ? ' / 逾期' : ''}) ${j.progress}/${j.work}WP，报酬¥${j.reward}，质量${j.quality}/及格${j.passQuality}`, `  ${j.description} 权重${JSON.stringify(j.weights)}；隐藏${j.hidden}条；${j.status === 'posted' ? `接单后${j.workSlots}工作时段` : `截止${j.deadline}`}；团队${j.team.map(m => m.character + ':' + m.role + ':' + m.mode).join(',') || '未派遣'}`);
    }
    const estimates = v.jobs.filter(j => j.status === 'working').reduce((n, j) => ({ cloud: n.cloud + j.resourceEstimate.cloud, local: n.local + j.resourceEstimate.local }), { cloud: 0, local: 0 });
    lines.push('下槽资源上限估计：云 ' + estimates.cloud.toFixed(2) + 'T / 本地 ' + estimates.local.toFixed(2) + '；短尾、事件与岗位跳过会降低实耗。');
    if (estimates.local > v.localCapacity || estimates.cloud > v.quota + v.purchased)
        lines.push('资源预警：可能停工；按接单顺序分配，同单负责人→执行→审查，同岗位按角色ID。可购额或调整部署。');
    if (v.pending) {
        lines.push(`事件：${v.pending.title}`);
        v.pending.choices.forEach((x, i) => lines.push(` choose ${i}: ${x.label}（¥${x.cost}，产出倍率${x.multiplier}，效果${JSON.stringify(x.effects ?? [])}）`));
    }
    lines.push('输入 help 查看操作。');
    return lines.join('\n');
}
export function explain(error: string): string {
    if (error === 'VERSION_MISMATCH')
        return '引擎或内容版本不兼容，请用对应检查点打开';
    if (/JSON|Unexpected token|Unexpected end/.test(error))
        return 'JSON 数据损坏或格式无效，请检查输入或存档文件';
    const added: Record<string, string> = { NOT_LIFE_SLOT: '只能在晚上或深夜加班', NO_ACTIVE_ACTOR: '该角色未在执行中的团队内', ALREADY_OVERTIME: '该角色本时段已在加班', INVALID_TEAM: '团队须包含1至4位角色', CRISIS_SMALL_ONLY: '危机中只能接合同总工作量不超过40WP的小单', UNSUPPORTED_COMMAND: '不支持该命令类型', INVALID_JOB: '委托编号须为字符串', INVALID_ACTOR: '角色编号须为字符串', INVALID_COMMAND: '命令必须为对象', STALE_CHOICE: '事件时段已失效', UNSUPPORTED_DEPLOYMENT: '角色不支持该部署方式', INVALID_SEED: '种子须为32位非负整数', EMPTY_CONTENT: '内容缺少角色或委托' };
    if (added[error])
        return `${added[error]} [${error}]`;
    if (error.includes('ENOENT'))
        return '尚无存档，请先 save';
    const extra: Record<string, string> = { PROJECT_LOCKED:'项目尚未开放或尚未开始',PROJECT_ACTIVE:'已选择项目路线',PROJECT_ROUTE:'未知项目路线',PROJECT_NOT_READY:'先完成当前委托并达到验收要求',PROJECT_COMPLETE:'项目已经完成', INVALID_OPTION:'范围方案不存在', SCOPE_NOT_CLARIFIED:'先澄清全部需求并等待下个时段', ENDING_FINISHED:'本周目已结束，可继续无尽经营', CHALLENGE_TEAM:'队伍不符合本周挑战', FINALE_LOCKED:'当前版本未开放终章', ENDING_LOCKED:'结局条件未满足', ENDLESS_LOCKED:'请先选择结局', EXPEDITION_LOCKED:'远征需第3章及有效目的地', BID_LOCKED:'竞标未开放或已投标', CHALLENGE_LOCKED:'挑战未完成或已领取', UNKNOWN_RIVAL:'未知对手', NO_INCIDENT:'当前没有可响应的维护事故', TOOL_LOCKED:'请先研发MCP市场且最多一位工具人', UNKNOWN_ACTOR: '找不到角色ID，请查看status', POSITIVE_AMOUNT_REQUIRED: '数量必须大于0', STILL_CLARIFYING: '澄清尚未完成，请推进一个时段', NOT_WORK_SLOT: '只能在上午或下午澄清', INVALID_CHOICE: '选项序号超出范围', INVALID_NUMBER: '请输入范围内的整数', INVALID_MEMBER: '角色岗位或部署方式无效', LOAN_LIMIT: '超过贷款上限', INVALID_REPAYMENT: '还款不得超过本金或可用资金', NOT_BANKRUPT: '尚未破产，不能继承重开' };
    if (extra[error])
        return `${extra[error]} [${error}]`;
    const labels: Record<string, string> = { ACTOR_BUSY: '角色正在执行委托或澄清，请推进时段或换人', PENDING_CHOICE: '请先 choose 事件选项', NOT_READY: '委托尚未完成执行', REWORK_AVAILABLE: '质量不足，请使用 rework 返工一次', NO_REWORK: '无法返工：需低于该模板及格线、尚未返工且未过截止', NOT_POSTED: '委托已不在可接受/拒绝状态', INSUFFICIENT_CASH: '资金不足', UNKNOWN_JOB: '找不到该委托编号', BANKRUPT: '工作室已破产，仍可存档或读取存档', NOT_ASSIGNABLE: '先接受委托，完成验收的委托不可重新派遣', DUPLICATE_ACTOR: '同一角色不能兼岗', INVALID_ROLES: '至少一位执行者，最多一位负责人和一位审查者', NOT_CLARIFIABLE: '只能澄清待接委托中尚未揭示的需求', NO_PENDING_CHOICE: '当前没有待选事件', INCOMPATIBLE_SAVE: '存档版本或内容不兼容，请使用对应检查点打开' };
    return labels[error] ? `${labels[error]} [${error}]` : error;
}
