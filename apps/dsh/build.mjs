import{build}from'vite';
import{mkdir,writeFile,cp}from'node:fs/promises';
import{loadAlphaContent}from'oot-content';
await build({configFile:false,build:{ssr:'src/index.ts',outDir:'dist',emptyOutDir:true,target:'node24',rollupOptions:{output:{entryFileNames:'index.js'}}},ssr:{noExternal:true}});
await build({configFile:false,build:{lib:{entry:'src/client.ts',formats:['es'],fileName:()=> 'client.js'},outDir:'dist',emptyOutDir:false,target:'es2022'}});
await mkdir('dist/web',{recursive:true});await cp('../web/dist','dist/web',{recursive:true});await writeFile('dist/content.json',JSON.stringify(loadAlphaContent()));
