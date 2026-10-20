import fs from 'node:fs';
const dir='supabase/functions/_shared';fs.mkdirSync(dir,{recursive:true});
for(const name of ['model','scoring']){
 let source=fs.readFileSync(`lib/v2/${name}.ts`,'utf8').replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${p.endsWith('.json')?p:p+'.ts'}'`);
 source=source.replace("from './frozen-content.json'","from './frozen-content.json' with {type:'json'}");
 fs.writeFileSync(`${dir}/${name}.ts`,source);
}
fs.copyFileSync('lib/v2/frozen-content.json',`${dir}/frozen-content.json`);
console.log('Synced frozen assessment model for Supabase; no passwords or database data included.');
