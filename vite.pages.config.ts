import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {copyFileSync,mkdirSync,existsSync} from 'node:fs';

export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'');
  const mainland=(process.env.DNA_DEPLOY_TARGET||env.DNA_DEPLOY_TARGET)==='mainland';
  const base=mainland?'/':process.env.PAGES_BASE_PATH||env.PAGES_BASE_PATH||'/';
  const api=mainland?'/api':process.env.VITE_SUPABASE_API_URL||env.VITE_SUPABASE_API_URL||'';
  const out=fileURLToPath(new URL(mainland?'./dist-mainland':'./dist-pages',import.meta.url));
  if(!base.startsWith('/')||!base.endsWith('/'))throw new Error('PAGES_BASE_PATH must start and end with /.');
  if(!mainland&&(!api||!/^https?:\/\//.test(api)))throw new Error('Set VITE_SUPABASE_API_URL to the deployed public Edge Function URL.');
  return {
    root:fileURLToPath(new URL('./frontend',import.meta.url)),
    envDir:process.cwd(),base,plugins:[react(),{name:'pages-deep-links',transformIndexHtml:{order:'pre',handler(html){return html.replace('%VITE_SUPABASE_API_URL%',api).replace('name="dna-routing" content="hash"',`name="dna-routing" content="${mainland?'path':'hash'}"`).replace('name="dna-images" content="remote"',`name="dna-images" content="${mainland?'local':'remote'}"`);}},closeBundle(){
      for(let q=1;q<=10;q++)for(const slot of ['main','a','b','c','d']){
        for(const extension of ['webp','jpg']){
          const file=`${out}/illustrations/q${String(q).padStart(2,'0')}-${slot}.${extension}`;
          if(!existsSync(file))throw new Error('Required quiz illustration missing from build: '+file);
        }
      }
      copyFileSync(`${out}/index.html`,`${out}/404.html`);
      for(const route of ['play','admin','result']){mkdirSync(`${out}/${route}`,{recursive:true});copyFileSync(`${out}/index.html`,`${out}/${route}/index.html`);}
    }}],
    publicDir:fileURLToPath(new URL('./public',import.meta.url)),
    build:{outDir:out,emptyOutDir:true,sourcemap:false},
    server:{host:'127.0.0.1',port:5174,fs:{allow:[process.cwd()]}},
    preview:{host:'127.0.0.1',port:4173},
  };
});
