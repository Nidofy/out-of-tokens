import {test,expect} from 'vitest';
import {flavor,parseFlavorPack} from './src/flavor.js';
import {GameSession} from 'oot-platform';
import {loadAlphaContent} from 'oot-content';
test('flavor model is bounded, deterministic and never changes session save',async()=>{
 const game=new GameSession(loadAlphaContent(),1),before=await game.exportSave();
 for(const language of ['zh','en'] as const)for(let slot=0;slot<100;slot++){const c={actor:'qwen',version:'qwq',scene:'library',slot,mood:40,language};expect(flavor(c,true)).toBe(flavor(c,true));expect(flavor(c,true).length).toBeLessThanOrEqual(language==='zh'?20:80);}
 expect(await game.exportSave()).toBe(before);
});
test('packs namespace IDs, reject scripts, duplicates and incompatible engines',()=>{
 const pack={schemaVersion:1,id:'tea',version:'1',engine:'0.11.0',author:'Studio',license:'CC0',lines:[{id:'rest',zh:'先喝茶。',en:'Tea first.'}]};
 expect(parseFlavorPack(JSON.stringify(pack)).lines[0]!.id).toBe('tea:rest');
 for(const bad of [{...pack,engine:'0'},{...pack,script:'alert(1)'},{...pack,lines:[...pack.lines,...pack.lines]},{...pack,lines:[{...pack.lines[0],zh:'<script>bad</script>'}]}])expect(()=>parseFlavorPack(JSON.stringify(bad))).toThrow();
});
