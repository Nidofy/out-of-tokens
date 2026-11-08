import type {Job, Template} from './model.js';
/** Board and authored commissions share the same initial contract state. */
export function postedJob(template:Template,id:string,slot:number):Job {
    return {id,template:template.id,status:'posted',posted:slot,deadline:0,duration:0,hidden:template.requirements?.length??Math.round((100-template.clarity)/25),work:template.workload,progress:0,weighted:0,review:0,defects:0,reworked:false,advance:0,quality:0,team:[],phase:0,resumeAt:0,qualityBonus:0,clarifyingUntil:0,reviewCoverage:0};
}
