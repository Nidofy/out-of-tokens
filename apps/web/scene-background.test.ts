import {afterEach,expect,test,vi} from 'vitest';
import {sceneBackground} from './src/scene-background.js';
afterEach(()=>vi.unstubAllGlobals());
function fixture(){
 const pending:{src:()=>string;resolve:()=>void;reject:()=>void}[]=[];
 class Image {src='';decode(){return new Promise<void>((resolve,reject)=>pending.push({src:()=>this.src,resolve,reject:()=>reject(Error('decode'))}));}}
 vi.stubGlobal('Image',Image);
 const host={style:{backgroundImage:''},parentElement:{setAttribute:vi.fn()}};
 return {pending,host,bg:sceneBackground(host as unknown as HTMLElement),flush:async()=>{for(let n=0;n<4;n++)await Promise.resolve();}};
}
test('only the newest decoded background is displayed, failures retry and destruction prevents late writes',async()=>{
 const f=fixture();f.bg.set('day',false);f.bg.set('night',true);
 f.pending[1]!.resolve();await f.flush();expect(f.host.style.backgroundImage).toBe('url("night")');
 f.pending[0]!.resolve();await f.flush();expect(f.host.style.backgroundImage).toBe('url("night")');
 f.bg.set('library',false);f.pending[2]!.reject();await f.flush();expect(f.host.style.backgroundImage).toBe('url("night")');
 f.bg.set('library',false);expect(f.pending).toHaveLength(4);f.bg.destroy();f.pending[3]!.resolve();await f.flush();
 f.bg.set('later',false);expect(f.pending).toHaveLength(4);expect(f.host.style.backgroundImage).toBe('url("night")');
});
test('retains a two-image LRU and never speculatively decodes other scenes',async()=>{
 const f=fixture();
 for(const src of ['day','night']){f.bg.set(src,src==='night');f.pending.at(-1)!.resolve();await f.flush();}
 expect(f.pending).toHaveLength(2);f.bg.set('day',false);await f.flush();expect(f.pending).toHaveLength(2);
 f.bg.set('library',false);f.pending.at(-1)!.resolve();await f.flush();
 f.bg.set('day',false);await f.flush();expect(f.pending).toHaveLength(3);
 f.bg.set('night',true);expect(f.pending).toHaveLength(4);
});
