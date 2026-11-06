import { PaperDoll } from './art/paper-doll.js';
import { sceneNames } from './campaign-ui.js';
import { Application, Container, Graphics, Text, Rectangle } from 'pixi.js';
import type { GameView } from 'oot-platform';
import { names } from './presentation.js';
const colors: Record<string, number> = { bluewhale: 0x6b9ea9, qwen: 0x8a83b2, llama: 0xc6b8a4, mistral: 0xcb805b, gpt: 0x6eaa95, claude: 0xb48268, kimi: 0x667599, gemini: 0x8a7ea6 };
function box(parent: Container, x: number, y: number, w: number, h: number, color: number, r = 8) { const g = new Graphics().roundRect(x, y, w, h, r).fill(color); parent.addChild(g); return g; }
function label(parent: Container, text: string, x: number, y: number, size = 14, color = 0x4c584c) { const t = new Text({ text, style: { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: size, fill: color, fontWeight: '500' } }); t.position.set(x, y); parent.addChild(t); return t; }
function room(root: Container) {
    box(root, 0, 0, 900, 450, 0xeee9dc, 0);
    box(root, 18, 15, 864, 290, 0xf7f3e9, 12);
    box(root, 18, 294, 864, 144, 0xe7ddc9, 8);
    const floor = new Graphics();
    for (let y = 320; y < 450; y += 32)
        floor.moveTo(20, y).lineTo(880, y);
    for (let x = 40; x < 900; x += 80)
        floor.moveTo(x, 296).lineTo(x - 25, 440);
    floor.stroke({ width: 1, color: 0xcdbfa7, alpha: .4 });
    root.addChild(floor);
    // Daylight, a pinboard, bookcase and plants are original procedural artwork.
    box(root, 315, 38, 265, 146, 0xc2ccba, 8);
    box(root, 323, 46, 249, 130, 0xdce7d3, 3);
    const sky = new Graphics().circle(512, 77, 23).fill(0xf6e3aa).ellipse(370, 147, 66, 33).fill(0xb2c4aa).ellipse(492, 162, 85, 39).fill(0xc4d1b7);
    root.addChild(sky);
    box(root, 440, 44, 8, 136, 0xfaf7ee, 0);
    box(root, 320, 110, 257, 7, 0xfaf7ee, 0);
    box(root, 304, 180, 287, 12, 0xb0b9a0, 4);
    box(root, 44, 57, 211, 120, 0xc3a47f);
    box(root, 51, 64, 197, 106, 0xd8c2a1, 3);
    box(root, 66, 76, 69, 76, 0xfffbeb, 2);
    box(root, 148, 83, 80, 62, 0xe4ead6, 2);
    label(root, '今日也要', 73, 87, 12);
    label(root, '好好开工', 73, 108, 12);
    label(root, '小事慢慢做', 155, 97, 11);
    label(root, '☕', 176, 114, 19);
    box(root, 684, 48, 160, 155, 0xc4b296, 5);
    for (const y of [99, 147, 193])
        box(root, 687, y, 154, 6, 0xa38f71, 1);
    for (let i = 0; i < 9; i++)
        box(root, 699 + i * 14, 62 + (i % 3) * 6, 10, 36 - (i % 3) * 6, [0x9eaf99, 0xd6b394, 0xaaa2bc][i % 3]!, 2);
    for (let i = 0; i < 5; i++)
        box(root, 699 + i * 23, 113, 18, 31, [0xc4a48b, 0x9eb1b1, 0xe3d3a7][i % 3]!, 2);
    box(root, 777, 162, 42, 26, 0xe2d2b5, 3);
    const plant = new Graphics().ellipse(74, 276, 25, 7).fill({ color: 0x897455, alpha: .13 }).roundRect(58, 244, 34, 29, 4).fill(0xbda282).moveTo(75, 248).lineTo(76, 197).stroke({ width: 3, color: 0x6f8464 }).ellipse(64, 215, 17, 8).fill(0x839970).ellipse(89, 203, 19, 8).fill(0x9cac7d).ellipse(88, 230, 17, 8).fill(0x7e956f);
    root.addChild(plant);
    label(root, 'OPEN SOURCE GARAGE', 338, 214, 13, 0x8d9680);
}
function doll(id: string, parent: Container, x: number, y: number, onSelect: (id: string) => void, version: string) {
    const tint = colors[id] ?? 0x84968a;
    const paper = new PaperDoll({schemaVersion:1,id,canvas:[100,130],feet:[50,120],visibleHeight:120,parts:[['body',null,[0,0]],['head','body',[0,-49]],['left','body',[0,0]],['right','body',[0,0]]].map(([part,parent,pivot],i)=>({id:part as string,parent:parent as string|null,pivot:pivot as [number,number],offset:[0,0],size:[1,1],z:i,mirror:'never'}))},new Map());
    const root = paper.root;
    root.position.set(x, y);
    parent.addChild(root);
    const shadow = new Graphics().ellipse(0, 12, 35, 9).fill({ color: 0x776e58, alpha: .13 });
    root.addChild(shadow);
    const body = paper.nodes.get('body')!;
    box(body, -19, -30, 38, 42, tint, 12);
    box(body, -15, 6, 11, 12, 0x5d655d, 5);
    box(body, 5, 6, 11, 12, 0x5d655d, 5);
    const armL = box(body, -29, -25, 13, 29, 0xf0d4bb, 6), armR = box(body, 16, -25, 13, 29, 0xf0d4bb, 6);
    const head = paper.nodes.get('head')!;
    head.y = -49;
    head.addChild(new Graphics().ellipse(0, 0, 28, 30).fill(tint).roundRect(-23, -7, 46, 35, 18).fill(0xf2d7c0));
    head.addChild(new Graphics().ellipse(-14, -15, 17, 16).fill(tint).ellipse(12, -17, 18, 14).fill(tint).circle(-9, 7, 2.1).fill(0x49534e).circle(9, 7, 2.1).fill(0x49534e).ellipse(-17, 15, 5, 2.5).fill(0xe8b7a9).ellipse(17, 15, 5, 2.5).fill(0xe8b7a9).moveTo(-3, 17).lineTo(3, 17).stroke({ color: 0xb77f6e, width: 1.5 }));
    if (id === 'llama')
        head.addChild(new Graphics().poly([-25, -15, -24, -41, -8, -25]).fill(0xd9d0c1).poly([9, -26, 24, -40, 26, -13]).fill(0xd9d0c1));
    if (id === 'qwen') {
        head.addChild(new Graphics().ellipse(0, -27, 32, 12).fill(0x716a93));
        box(head, 21, -8, 10, 49, tint, 4);
    }
    if (id === 'mistral')
        head.addChild(new Graphics().ellipse(0, -26, 34, 10).fill(0xa35d40).poly([9, -33, 26, -50, 22, -29]).fill(0xe0bb76));
    if (id === 'bluewhale')
        head.addChild(new Graphics().poly([19, -21, 35, -36, 33, -19, 45, -13, 27, -11]).fill(0x6693a0));
    if (['r1','qwq','3.1','large','4o','sonnet','k2','pro'].includes(version.split('.').slice(1).join('.'))) head.addChild(new Graphics().star(20,-20,5,9,4).fill(0xe6c574));
    root.eventMode = 'static';
    root.cursor = 'pointer';
    root.hitArea = new Rectangle(-40, -100, 80, 125);
    root.on('pointertap', () => onSelect(id));
    return { root, body, armL, armR, paper };
}
export async function createWorkshop(host: HTMLElement, onSelect: (id: string) => void) {
    const app = new Application();
    await app.init({ resizeTo: host, backgroundAlpha: 0, antialias: true, resolution: Math.min(devicePixelRatio || 1, 2), autoDensity: true, preference: 'webgl' });
    app.canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(app.canvas);
    const world = new Container();
    app.stage.addChild(world);
    let actors: {
        paper: PaperDoll;
        body: Container;
        armL: Graphics;
        armR: Graphics;
        working: boolean;
        base: number;
    }[] = [], elapsed = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const update = (view: GameView) => {
        for (const child of world.removeChildren())
            child.destroy({ children: true });
        room(world);
        actors = [];
        const scene = view.campaign?.scene ?? 'workshop';
        if(scene !== 'workshop') {
            box(world,18,15,864,290,scene === 'library' ? 0xe1e6da : 0xf1dfc9,12);
            label(world,sceneNames[scene],380,45,28);
            if(scene === 'library') for(let i=0;i<10;i++) {box(world,80+i*70,100,45,90,colors[view.actors[i%view.actors.length]!.id] ?? 0xaabaac,3);}
            else {for(let i=0;i<6;i++){box(world,110+i*110,120,75,50,0xc29c70);world.addChild(new Graphics().ellipse(145+i*110,133,26,10).fill(0xfff3dd));}}
        }
        view.actors.filter(a=>a.location===scene).forEach((actor, index) => {
            const x = 135 + (index % 6) * 127, y = index < 6 ? 318 : 190, working = view.jobs.some(j => j.status === 'working' && j.team.some(m => m.character === actor.id));
            box(world, x - 36, y - 18, 72, 63, 0xc7ccba, 15);
            const figure = doll(actor.id, world, x, y, onSelect, actor.version);
            actors.push({ ...figure, working, base: index * .8 });
            box(world, x - 66, y + 2, 132, 10, 0xb59775, 4);
            box(world, x - 61, y + 10, 8, 49, 0xa68c6e, 2);
            box(world, x + 53, y + 10, 8, 49, 0xa68c6e, 2);
            box(world, x - 31, y - 22, 62, 39, 0x66776b, 5);
            box(world, x - 26, y - 17, 52, 27, working ? 0xc8d9be : 0xc2cec2, 2);
            box(world, x - 38, y + 19, 76, 5, 0xadb4a0, 2);
            const lines = new Graphics().moveTo(x - 18, y - 8).lineTo(x + 13, y - 8).moveTo(x - 18, y - 1).lineTo(x + 1, y - 1).stroke({ color: 0x82967f, width: 2, alpha: .7 });
            world.addChild(lines);
            box(world, x + 43, y - 4, 14, 18, index % 2 ? 0xe3c39c : 0xadbca1, 4);
            const name = label(world, names[actor.id] ?? actor.id, x - 40, 384, 13);
            name.x = x - name.width / 2; name.y = y + 64;
            const status = label(world, working ? '认真开工中' : actor.busy ? '正在忙碌' : '等你安排', x - 40, 405, 11, working ? 0x5a7955 : 0x909783);
            status.x = x - status.width / 2; status.y = y + 87;
        });
    };
    app.ticker.add(t => {
        elapsed += Math.min(t.deltaMS, 50) / 1000;
        world.scale.set(Math.min(app.screen.width / 900, app.screen.height / 450));
        world.position.set((app.screen.width - 900 * world.scale.x) / 2, (app.screen.height - 450 * world.scale.y) / 2);
        for (const a of actors) {
            a.paper.apply({expression:'neutral',ended:false,transforms:Object.fromEntries(['body','head','left','right'].map(id=>[id,{x:0,y:id==='body'&&!reduce.matches?Math.sin(elapsed*1.8+a.base)*1.6:0,rotation:0,scaleX:1,scaleY:1}]))});
            a.armL.rotation = reduce.matches || !a.working ? 0 : Math.sin(elapsed * 6 + a.base) * .035;
            a.armR.rotation = -a.armL.rotation;
        }
    });
    return { update, destroy() { app.destroy(true, { children: true }); } };
}
