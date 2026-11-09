import {mkdirSync,writeFileSync} from 'node:fs';
const dir='apps/web/public/art/office';mkdirSync(dir,{recursive:true});
const defs=`<defs>
<radialGradient id="sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3a291c" stop-opacity=".26"/><stop offset=".68" stop-color="#3a291c" stop-opacity=".11"/><stop offset="1" stop-color="#3a291c" stop-opacity="0"/></radialGradient>
<linearGradient id="wood" x1="0" y1="0" x2=".75" y2="1"><stop offset="0" stop-color="#f0cca0"/><stop offset=".55" stop-color="#cf9666"/><stop offset="1" stop-color="#9e6742"/></linearGradient>
<linearGradient id="wood2" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#f5dab4"/><stop offset=".5" stop-color="#d7a170"/><stop offset="1" stop-color="#a87048"/></linearGradient>
<linearGradient id="panel" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#9a6845"/><stop offset="1" stop-color="#6d462d"/></linearGradient>
<linearGradient id="walnut" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#685344"/><stop offset="1" stop-color="#43342a"/></linearGradient>
<linearGradient id="screen" x1="0" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#2c4349"/><stop offset="1" stop-color="#4d6d74"/></linearGradient>
<linearGradient id="cloth" x1="0" y1="0" x2=".65" y2="1"><stop offset="0" stop-color="#c4be9f"/><stop offset="1" stop-color="#7c7a67"/></linearGradient>
<linearGradient id="mesh" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#968e7b"/><stop offset="1" stop-color="#5d5649"/></linearGradient>
</defs>`;
const wrap=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-140 -200 280 240">${defs}<g stroke="#654b38" stroke-width="1.25" stroke-opacity=".62" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
const desk=standard=>`<ellipse cx="6" cy="15" rx="124" ry="18" fill="url(#sh)" stroke="none"/>
<path d="M-94 -58H94V-8H-94Z" fill="${standard?'url(#walnut)':'url(#panel)'}"/>
<path d="M-94 -20H94V-6H-94Z" fill="#261a12" opacity=".32" stroke="none"/>
${standard?'<path d="M-80 -34H80" stroke="#d8b578" stroke-width="1.8" stroke-opacity=".85"/><rect x="44" y="-45" width="38" height="14" rx="4" fill="#33261e" stroke="#d8b578" stroke-width="1.1"/><path d="M51 -38H63M68 -38H75" stroke="#f3d69b" stroke-width="2"/>':''}
<path d="M-106 -52V15H-93V-46M93 -52V15H106V-46" fill="${standard?'#554338':'#8c5e3c'}"/>
${standard?'<rect x="-109" y="11" width="19" height="5" rx="2" fill="#cfa96e"/><rect x="90" y="11" width="19" height="5" rx="2" fill="#cfa96e"/>':''}
<path d="M-120 -62L-94 -88H94L120 -62V-47H-120Z" fill="${standard?'url(#wood2)':'url(#wood)'}"/>
<path d="M-118 -62H118" stroke="#7d5234" stroke-width="1.4" stroke-opacity=".5"/>
<path d="M-92 -86H92" stroke="#fff4dc" stroke-width="2" stroke-opacity=".75"/>
${standard?`<g transform="translate(-88,-74)"><path d="M-9 0L-6 10H6L9 0Z" fill="#c98b63"/><ellipse cy="-3" rx="9" ry="5" fill="#7fa37c"/><circle cx="-4" cy="-6" r="4" fill="#95b88f"/><circle cx="4" cy="-5" r="3.5" fill="#6b8f69"/></g>
`:`<path d="M-98 -82L-74 -85L-69 -70L-94 -67Z" fill="#f5ebc9" stroke-width="1"/>`}
<g transform="translate(82,-11) scale(.72)">
<path d="M-7 -92V-68L-26 -63H26L7 -68V-92" fill="${standard?'#6a5b50':'#8b7b6e'}"/>
<rect x="-56" y="-154" width="112" height="68" rx="${standard?6:10}" fill="${standard?'#473b33':'#dfd0b2'}" stroke="${standard?'#caa66d':'#654b38'}" stroke-width="1.3"/>
<rect x="-48" y="-146" width="96" height="50" rx="3" fill="url(#screen)"/>
<path d="M-38 -134H-8M-38 -123H24M-38 -112H8" stroke="#c7ead4" stroke-width="2.6"/>
<circle cx="40" cy="-90" r="2.2" fill="#c2dfa6" stroke="none"/>
${standard?'<rect x="-36" y="-160" width="72" height="4.5" rx="2" fill="#f5d596" stroke="#8c6b3f" stroke-width=".9"/>':''}
</g>
<path d="M-52 -70H14L22 -57H-60Z" fill="#efe6d5" stroke-width="1.2"/>
<path d="M54 -88H71V-68Q62 -63 54 -68Z" fill="#fbf0d7"/><path d="M71 -84Q82 -85 76 -73H71" fill="none" stroke-width="1.4"/>`;
for(const standard of [false,true]){
 const id=standard?'standard':'basic';
 writeFileSync(`${dir}/${id}-front.svg`,wrap(desk(standard)));
 writeFileSync(`${dir}/${id}-back.svg`,wrap(standard
  ?'<path d="M-38 -72V-146Q0 -162 38 -146V-72Z" fill="url(#mesh)" stroke="#c8a56c" stroke-width="1.2"/><rect x="-22" y="-168" width="44" height="17" rx="7" fill="url(#mesh)" stroke="#c8a56c" stroke-width="1.1"/><path d="M-24 -138V-84M0 -142V-84M24 -138V-84" stroke="#3f382f" stroke-opacity=".35"/><ellipse cy="-22" rx="40" ry="12" fill="url(#mesh)"/>'
  :'<rect x="-30" y="-122" width="60" height="24" rx="7" fill="url(#wood)"/><path d="M-28 -120H28" stroke="#fff4dc" stroke-width="1.5" stroke-opacity=".7"/><path d="M-20 -98V-68M20 -98V-68" stroke="#7c5335" stroke-width="4"/><ellipse cy="-20" rx="32" ry="10" fill="url(#wood)"/>'));
}
const furniture={
 whiteboard:'<ellipse cx="6" cy="18" rx="118" ry="15" fill="url(#sh)" stroke="none"/><rect x="-112" y="-18" width="224" height="28" rx="10" fill="#4f3d30" opacity=".22" stroke="none"/><path d="M-84 -52L-98 16M84 -52L98 16" stroke="#7c563a" stroke-width="5"/><rect x="-112" y="-176" width="224" height="126" rx="10" fill="url(#wood)"/><path d="M-108 -174H108" stroke="#fff4dc" stroke-width="2" stroke-opacity=".8"/><rect x="-102" y="-166" width="204" height="106" rx="5" fill="#f7eed8"/><path d="M-76 -142H24M-76 -124H68M-76 -106H12" stroke="#6f8782" stroke-width="3.4"/><rect x="42" y="-98" width="34" height="26" rx="3" fill="#ebd28e"/><path d="M-112 -50H112" stroke="#855c3d" stroke-width="4.5"/>',
 coffee:'<ellipse cx="6" cy="16" rx="90" ry="14" fill="url(#sh)" stroke="none"/><path d="M-74 -92H74V14H-74Z" fill="url(#wood)"/><path d="M-74 -24H74V14H-74Z" fill="#3a2618" opacity=".18" stroke="none"/><path d="M-82 -96L-66 -112H66L82 -96V-88H-82Z" fill="url(#wood2)"/><path d="M-64 -110H64" stroke="#fff4dc" stroke-width="2" stroke-opacity=".8"/><rect x="-48" y="-158" width="60" height="48" rx="7" fill="#6d756e"/><rect x="-39" y="-149" width="42" height="18" rx="3" fill="#dce4c8"/><path d="M24 -132H46V-112H24Z" fill="#fbf0d8"/><path d="M-58 -76H58V2H-58ZM0 -76V2" fill="none" stroke-opacity=".45"/>',
 sofa:'<ellipse cx="6" cy="16" rx="122" ry="18" fill="url(#sh)" stroke="none"/><rect x="-104" y="-138" width="208" height="116" rx="28" fill="url(#cloth)"/><path d="M-84 -136H84" stroke="#fff6e3" stroke-width="2" stroke-opacity=".65"/><rect x="-86" y="-120" width="78" height="64" rx="15" fill="#d0c8ad"/><rect x="8" y="-120" width="78" height="64" rx="15" fill="#d0c8ad"/><path d="M-94 -54H94L106 -22H-106Z" fill="#dcd2b5"/><rect x="-120" y="-84" width="30" height="70" rx="12" fill="url(#cloth)"/><rect x="90" y="-84" width="30" height="70" rx="12" fill="url(#cloth)"/><path d="M-96 -12V14M96 -12V14" stroke="#6c4c33" stroke-width="6"/>',
 server:'<ellipse cx="6" cy="17" rx="66" ry="14" fill="url(#sh)" stroke="none"/><path d="M-56 -164L-38 -182H62V8L44 20H-56Z" fill="url(#walnut)"/><path d="M-36 -180H60" stroke="#e8CFA8" stroke-width="1.6" stroke-opacity=".65"/><rect x="-48" y="-156" width="86" height="164" rx="5" fill="#2f2823" stroke="#b89660" stroke-width="1"/>'+Array.from({length:6},(_,i)=>`<rect x="-40" y="${-146+i*24}" width="70" height="17" rx="3" fill="#52463e"/><circle cx="20" cy="${-138+i*24}" r="2.5" fill="#c5df9b" stroke="none"/><path d="M-32 ${-138+i*24}H8" stroke="#a89b8c" stroke-width="1.4"/>`).join('')
};
for(const [id,body] of Object.entries(furniture)){writeFileSync(`${dir}/${id}-back.svg`,wrap(body));writeFileSync(`${dir}/${id}-front.svg`,wrap(''));}
writeFileSync(`${dir}/SOURCE.txt`,'Original SVG furniture authored for Out of Tokens, 2026-11-09. Source: scripts/create-office-art.mjs. No external images or traced artwork. Distributed under the repository license. Back/front layers share the same floor anchor (0,0).');
const table='<ellipse cx="6" cy="18" rx="122" ry="16" fill="url(#sh)" stroke="none"/><path d="M-90 -52H90V-16H-90Z" fill="url(#panel)"/><path d="M-98 -48V18M98 -48V18" stroke="#7d563c" stroke-width="9"/><path d="M-120 -66L-92 -92H92L120 -66V-48H-120Z" fill="url(#wood)"/><path d="M-90 -90H90" stroke="#fff4dc" stroke-width="2" stroke-opacity=".75"/>';
for(const kind of ['dining','reading']){
 const prop=kind==='dining'
  ?'<ellipse cy="-84" rx="38" ry="13" fill="#fff8dd"/><path d="M-36 -84Q-26 -46 26 -58Q36 -66 36 -84Z" fill="#b4c8bf"/><ellipse cy="-86" rx="28" ry="8" fill="#fff"/><path d="M54 -105L49 -66M63 -102L57 -66" stroke="#866149" stroke-width="2.6"/>'
  :'<path d="M-58 -102L0 -93L58 -102V-66L0 -57L-58 -66Z" fill="#fff5d7"/><path d="M0 -93V-57M-46 -91L-12 -84M12 -84L46 -91M-46 -79L-12 -73M12 -73L46 -79" stroke="#b69b72" stroke-width="1.6"/>';
 writeFileSync(`${dir}/${kind}-front.svg`,wrap(`${table}${prop}`));
 writeFileSync(`${dir}/${kind}-back.svg`,wrap(''));
}
