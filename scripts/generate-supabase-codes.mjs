import fs from 'node:fs';import crypto from 'node:crypto';
const count=Number(process.argv[2]||20);if(!Number.isInteger(count)||count<1||count>500)throw new Error('Choose 1–500 codes.');
fs.mkdirSync('outputs',{recursive:true});const stamp=Date.now(),codes=Array.from({length:count},()=>`DNA-${crypto.randomBytes(8).toString('hex').toUpperCase()}`);
fs.writeFileSync(`outputs/codes-${stamp}.txt`,codes.join('\n')+'\n');
const sql=codes.map(code=>`insert into dna_private.access_codes(hash,used,disabled,created_at) values('${crypto.createHash('sha256').update(code).digest('hex')}',0,false,${stamp}) on conflict(hash) do nothing;`).join('\n');
fs.writeFileSync(`outputs/codes-${stamp}.sql`,sql+'\n');console.log(`Generated ${count} codes. Private files: outputs/codes-${stamp}.txt and .sql. Run the SQL in your Supabase SQL Editor; never commit either file.`);
