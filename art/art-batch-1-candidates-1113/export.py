from pathlib import Path
from PIL import Image, ImageOps
import json, hashlib, shutil
root=Path(__file__).parent
sources=Path(r'C:\Users\enxi1\.codex\generated_images\01a1d2ce-a71c-7362-8d10-d0c757d672c9')
entries=json.loads((root/'requests.json').read_text(encoding='utf-8-sig'))
assets=[]
def record(path, entry, role):
    im=Image.open(path)
    alpha=im.getchannel('A').getextrema() if im.mode=='RGBA' else None
    assets.append(dict(file=str(path.relative_to(root)).replace('\\','/'),purpose=role,id=entry['id'],width=im.width,height=im.height,bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),alphaRange=alpha,model='OpenAI built-in image_gen (exact model/version not exposed)',parameters={'transparent_background':entry['id']!='icon'},source=entry['source'],prompt=entry['prompt'],status='candidate; not integrated or visually accepted'))
for entry in entries:
    master=root/'masters'/(entry['id']+'.png')
    shutil.copyfile(sources/entry['source'],master)
    record(master,entry,'untouched generation master')
    im=Image.open(master).convert('RGBA')
    if entry['id']=='icon':
        for size,name in [(192,'icon-192.png'),(512,'icon-512.png'),(512,'icon-maskable-512.png')]:
            target=root/'runtime'/name
            ImageOps.fit(im,(size,size),method=Image.Resampling.LANCZOS).convert('RGB').save(target,optimize=True)
            record(target,entry,'PWA icon candidate; maskable crop needs browser verification')
    else:
        target=root/'runtime'/(entry['id']+'.webp')
        ImageOps.pad(im,(512,512),method=Image.Resampling.LANCZOS,color=(0,0,0,0)).save(target,quality=88,method=6)
        record(target,entry,'Stage B 512 square candidate; proportional resize and transparent padding only')
(root/'manifest.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
prompts='# Art Batch 1 candidate prompts\n\nGenerated 2026-11-13 with built-in image_gen. Exact model ID, seed and quality are not exposed by the tool. One call per asset. Character references: existing apps/web/public/art/ai-village/portraits/<id>.png; original sources and license remain unchanged. No external reference images. These are candidates, not an accepted release.\n\n'
for entry in entries: prompts+='## '+entry['id']+'\n\n'+entry['prompt']+'\n\n'
(root/'PROMPTS.md').write_text(prompts,encoding='utf-8')
print(json.dumps({'files':len(assets),'runtimeBytes':sum(a['bytes'] for a in assets if a['file'].startswith('runtime/')),'assets':[{k:a[k] for k in ['file','width','height','bytes','alphaRange']} for a in assets]},indent=2))

