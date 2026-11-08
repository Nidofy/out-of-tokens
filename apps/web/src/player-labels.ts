export function ledgerLabel(reason:string,english:boolean){
 const labels:Record<string,[string,string]>={'project-retry':['客户重约费','Client rebooking fee'],delivery:['交付结算','Delivery settlement'],advance:['合同预付款','Contract advance'],breach:['违约退款与罚款','Breach refund and penalty'],weekly:['每周账单（含电费与订阅）','Weekly bill (electricity and subscription included)'],'loan-interest':['贷款利息','Loan interest'],'inherited-debt':['偿还旧债','Inherited debt payment'],loan:['贷款到账','Loan received'],repay:['偿还贷款','Loan repayment'],'buy-tokens':['临时补充额度','Purchased credits'],event:['事件收支','Event payment'],'sla-penalty':['维护逾期赔付','Late maintenance penalty'],campaign:['工作室活动','Studio activity']};
 return labels[reason.split(':')[0]!] ? labels[reason.split(':')[0]!]![english?1:0] : english?'Studio transaction':'工作室收支';
}
export function effectLabel(kind:string,value:number,english:boolean){
 const labels:Record<string,[string,string]>={work:['工作量','Workload'],quality:['质量','Quality'],defects:['缺陷','Defects'],mood:['心情','Mood'],compact:['上下文整理','Context compaction'],reset:['重置进度','Reset progress'],tokenRate:['资源消耗倍率','Resource multiplier'],cashPercent:['现金变化比例','Cash change ratio']};
 return `${labels[kind]?.[english?1:0]??(english?'Effect':'影响')} ${kind==='tokenRate'?'×':value>0?'+':''}${value}`;
}
