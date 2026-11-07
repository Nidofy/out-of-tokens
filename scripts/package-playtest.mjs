import {bundleDesktop} from './bundle-desktop.mjs';
import {engineVersion} from '../packages/oot-core/dist/index.js';
import {loadFullContent} from '../packages/oot-content/dist/index.js';
const contentVersion=loadFullContent().version;
import{mkdir,cp,readFile,writeFile,readdir,stat}from'node:fs/promises';
import{resolve,join,relative}from'node:path';
import{execFileSync}from'node:child_process';
import{createHash}from'node:crypto';
const root=process.cwd(),git=(...args)=>execFileSync('git',['-c',`safe.directory=${root.replaceAll('\\','/')}`,...args],{encoding:'utf8'}).trim();
const sha=git('rev-parse','HEAD');if(git('status','--porcelain'))throw Error('COMMIT_BEFORE_PACKAGING');
await mkdir('artifacts',{recursive:true});
const output=resolve('artifacts',`out-of-tokens-${sha.slice(0,7)}`);await mkdir(output,{recursive:false});
await cp('apps/web/dist',join(output,'web'),{recursive:true});await cp('scripts/playtest-server.mjs',join(output,'start.mjs'));
await cp('apps/dsh/dist',join(output,'dsh','dist'),{recursive:true});await cp('apps/dsh/cordis.patch.yml',join(output,'dsh','cordis.patch.yml'));
const pkg=JSON.parse(await readFile('apps/dsh/package.json','utf8'));delete pkg.dependencies;delete pkg.devDependencies;delete pkg.scripts;await writeFile(join(output,'dsh','package.json'),JSON.stringify(pkg,null,2));
await cp('apps/dsh/src/vendor/ATOMIC-WRITE-LICENSE.txt',join(output,'dsh','ATOMIC-WRITE-LICENSE.txt'));
await mkdir(join(output,'docs'));for(const name of ['PLAYTEST_M1.md','M1_ACCEPTANCE.md','M2_ACCEPTANCE.md','M3_ACCEPTANCE.md','M3_INSTALL.md','M4_SCOPE.md','M5_ACCEPTANCE.md','M5_RULES.md'])await cp(join('docs',name),join(output,'docs',name));
// Bundle original dependency license files. Superset includes development tools, explicitly labelled.
const notices=join(output,'dependency-license-files');await mkdir(notices);let licenses=0;
for(const entry of await readdir('node_modules/.pnpm',{withFileTypes:true})){if(!entry.isDirectory()||entry.name==='node_modules')continue;const modules=join('node_modules/.pnpm',entry.name,'node_modules');let entries;try{entries=await readdir(modules,{withFileTypes:true});}catch{continue;}const dirs=[];for(const e of entries){if(e.isSymbolicLink())continue;if(e.name.startsWith('@')){for(const sub of await readdir(join(modules,e.name),{withFileTypes:true}))if(!sub.isSymbolicLink())dirs.push(join(modules,e.name,sub.name));}else if(e.isDirectory())dirs.push(join(modules,e.name));}
for(const dir of dirs){for(const f of await readdir(dir)){if(!/^(license|licence|copying|notice)(\.|$)/i.test(f)||!(await stat(join(dir,f))).isFile())continue;const dest=join(notices,entry.name.replaceAll(':','_'),relative(modules,dir));await mkdir(dest,{recursive:true});await cp(join(dir,f),join(dest,f));licenses++;}}}
await writeFile(join(notices,'README.txt'),'Original license files from the locked local dependency installation. This is a superset, including build tools; not every listed package is shipped at runtime. PaperDoll and atomic-write licenses are also provided next to their shipped code.\n');
await writeFile(join(output,'README.txt'),`Out of Tokens — M1-M5 experimental engineering playtest\nSource commit: ${sha}\nEngine ${engineVersion} / content ${contentVersion}\n\n1. Install/use Node.js 24 (not bundled). No pnpm or package download needed.\n2. In this folder run: node start.mjs\n3. Open http://localhost:4173 (use the same origin each time for browser saves).\n4. Click 存档 to export a backup before replacing builds or clearing browser data.\n\nNo real model API, deployment, paid calls or telemetry. Close terminal with Ctrl+C.\nM05-03 business gate remains OPEN; this is experimental, not a balance-approved release.\nNo 10-person playtest or real DSH co-existence approval is claimed. DSH package is in dsh/; installation instructions and boundaries in docs/M3_INSTALL.md. Do not overwrite your live profile.\nDependency license files: ${licenses}; see dependency-license-files.\n`);
await writeFile(join(output,'start.cmd'),'@echo off\r\ncd /d "%~dp0"\r\nnode start.mjs\r\npause\r\n');
await cp('content/packs',join(output,'example-dialogue-packs'),{recursive:true});
if(process.argv.includes('--desktop'))await bundleDesktop(output,process.argv[process.argv.indexOf('--rust-registry')+1]);
const files={};async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isDirectory())await walk(path);else files[relative(output,path).replaceAll('\\','/')]=createHash('sha256').update(await readFile(path)).digest('hex');}}await walk(output);
await writeFile(join(output,'manifest.json'),JSON.stringify({schemaVersion:1,sourceCommit:sha,engineVersion,contentVersion,businessApproved:false,humanTesters:0,desktopIncluded:process.argv.includes('--desktop'),files},null,2));console.log(output);
