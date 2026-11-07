import {readFile,writeFile,mkdir,cp,readdir,stat} from 'node:fs/promises';
import {join} from 'node:path';
/** Called by package-playtest; read the exact offline Cargo lock and preserve original notices. */
export async function bundleDesktop(output,registry){
 if(!registry)throw Error('RUST_REGISTRY_REQUIRED');
 const dest=join(output,'desktop');await mkdir(dest);
 await cp('apps/desktop/target/debug/out-of-tokens-desktop.exe',join(dest,'out-of-tokens.exe'));
 const lock=await readFile('apps/desktop/Cargo.lock','utf8');await writeFile(join(dest,'Cargo.lock'),lock);
 const notices=join(dest,'licenses');await mkdir(notices);const entries=[];
 for(const section of lock.split('[[package]]').slice(1)){
  const name=section.match(/\nname = "([^"]+)"/)?.[1],version=section.match(/\nversion = "([^"]+)"/)?.[1];
  if(!section.includes('source = "registry+'))continue;
  const directory=join(registry,`${name}-${version}`);let files;try{files=await readdir(directory);}catch{entries.push({name,version,sourceAvailable:false});continue;}
  const target=join(notices,`${name}-${version}`);await mkdir(target);await cp(join(directory,'Cargo.toml'),join(target,'Cargo.toml'));
  const copied=[];for(const file of files){if(!/^(LICENSE|LICENCE|NOTICE|COPYING)([-.]|$)/i.test(file))continue;const path=join(directory,file);if((await stat(path)).isFile()){await cp(path,join(target,file));copied.push(file);}}
  entries.push({name,version,sourceAvailable:true,licenseFiles:copied});
 }
 await writeFile(join(dest,'dependency-notices.json'),JSON.stringify(entries,null,2));
 await writeFile(join(dest,'README.txt'),'Windows x64 experimental Tauri development build. Requires the installed Microsoft Edge WebView2 runtime. Run out-of-tokens.exe; no Node or pnpm needed. No installer, Steam integration or model download. Saves use this app WebView storage, separate from your browser and DSH. Export progress before upgrading. License inventory is a Cargo-lock superset (includes build tools and other-platform dependencies); unavailable sources are listed, not represented as inspected.\n');
}
