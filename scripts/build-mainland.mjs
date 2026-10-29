import {build} from 'vite';
import {fileURLToPath} from 'node:url';
process.env.DNA_DEPLOY_TARGET='mainland';
await build({configFile:fileURLToPath(new URL('../vite.pages.config.ts',import.meta.url))});
