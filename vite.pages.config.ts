import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'');
  const base=process.env.PAGES_BASE_PATH||env.PAGES_BASE_PATH||'/';
  const api=process.env.VITE_SUPABASE_API_URL||env.VITE_SUPABASE_API_URL||'';
  if(!base.startsWith('/')||!base.endsWith('/'))throw new Error('PAGES_BASE_PATH must start and end with /.');
  if(!api||!/^https?:\/\//.test(api))throw new Error('Set VITE_SUPABASE_API_URL to the deployed public Edge Function URL.');
  return {
    root:fileURLToPath(new URL('./pages',import.meta.url)),
    envDir:process.cwd(),base,plugins:[react()],
    publicDir:fileURLToPath(new URL('./public',import.meta.url)),
    build:{outDir:fileURLToPath(new URL('./dist-pages',import.meta.url)),emptyOutDir:true,sourcemap:false},
    server:{host:'127.0.0.1',port:5174,fs:{allow:[process.cwd()]}},
    preview:{host:'127.0.0.1',port:4173},
  };
});
