export const accessTokenFormat=/^[A-HJ-NP-Z2-9]{26}$/;
export const accessStatuses=['all','unused','used_1','used_2','exhausted','disabled'];
export const accessStatusLabels:Record<string,string>={unused:'未使用',used_1:'已使用1次',used_2:'已使用2次',exhausted:'已用完',disabled:'已停用'};
export function newAccessToken(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 return Array.from(crypto.getRandomValues(new Uint8Array(26)),n=>alphabet[n&31]).join('');
}
export function accessCsv(items:Record<string,unknown>[]){
 const columns=['token','access_url','max_starts','used_starts','status','created_at'];
 const escape=(value:unknown)=>'"'+String(value??'').replace(/"/g,'""')+'"';
 return '\uFEFF'+columns.join(',')+'\r\n'+items.map(item=>columns.map(key=>escape(key==='status'?accessStatusLabels[String(item[key])]:item[key])).join(',')).join('\r\n')+'\r\n';
}
