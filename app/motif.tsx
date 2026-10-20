import type {TypeId} from '../lib/v2/model';

// Original compositions, shared with the PNG renderer.
export function motifShapes(type: TypeId) {
 switch(type) {
 case 'T1': return <>
  <rect x="94" y="62" width="612" height="500" fill="#fbfbf7"/>
  <rect x="94" y="62" width="180" height="184" fill="#d9382b"/><rect x="556" y="394" width="150" height="168" fill="#edc83c"/><rect x="94" y="394" width="110" height="168" fill="#245ba0"/>
  <path d="M274 62V562M556 62V562M94 246H706M94 394H706M204 394V562M556 490H706" stroke="#202020" strokeWidth="12" fill="none"/><rect x="94" y="62" width="612" height="500" fill="none" stroke="#202020" strokeWidth="3"/>
 </>;
 case 'T2': return <>
  <path d="M96 68V556M248 68V556M400 68V556M552 68V556M704 68V556M96 68H704M96 190H704M96 312H704M96 434H704M96 556H704" fill="none" stroke="#d7d2c7"/>
  <text x="91" y="288" fontFamily="Helvetica,Arial,sans-serif" fontSize="260" fontWeight="700" letterSpacing="-24" fill="#181818">02</text>
  <path d="M400 68H704V190H400Z" fill="#d83b2d"/><path d="M248 345H704M248 378H580M248 411H636" stroke="#181818" strokeWidth="13"/>
  <circle cx="156" cy="494" r="54" fill="#d83b2d"/><text x="400" y="512" fontFamily="Helvetica,Arial,sans-serif" fontSize="18" letterSpacing="4" fill="#181818">ORDER / SYSTEM</text><path d="M400 532H704" stroke="#181818" strokeWidth="2"/>
 </>;
 case 'T3': return <>
  <defs><linearGradient id="dna-surreal-sky" x2="0" y2="1"><stop stopColor="#bbd2ce"/><stop offset="1" stopColor="#e5ded0"/></linearGradient><radialGradient id="dna-surreal-orb" cx=".3" cy=".25" r=".8"><stop stopColor="#f6d3a1"/><stop offset=".65" stopColor="#b7774d"/><stop offset="1" stopColor="#784c39"/></radialGradient></defs>
  <rect x="76" y="48" width="648" height="514" fill="url(#dna-surreal-sky)"/><path d="M76 368Q330 346 724 368V562H76Z" fill="#d9bd8e"/><path d="M340 441L645 513L702 496L404 412Z" fill="#6d674e" opacity=".28"/>
  <path d="M302 440V243A88 88 0 0 1 478 243V440H434V249A44 44 0 0 0 346 249V440Z" fill="#eee1c5"/><path d="M478 243L503 260V426L478 440Z" fill="#8f846a"/><path d="M346 440V249A44 44 0 0 1 434 249V440Z" fill="#4a7473"/>
  <ellipse cx="389" cy="406" rx="56" ry="11" fill="#293f3d" opacity=".22"/><circle cx="390" cy="294" r="55" fill="url(#dna-surreal-orb)"/>
  <path d="M145 493L144 423M127 493H166" stroke="#4d5d50" strokeWidth="2"/><path d="M632 198C648 177 665 177 682 184M653 149C665 142 675 142 685 147" stroke="#4b6863" fill="none" strokeWidth="2"/><circle cx="166" cy="140" r="16" fill="#f5e5bd"/>
 </>;
 case 'T4': return <>
  <path d="M129 412C38 259 178 110 372 132S682 242 652 418S246 558 129 412Z" fill="#e6c852" opacity=".62"/><circle cx="500" cy="258" r="123" fill="#355daa"/><circle cx="500" cy="258" r="80" fill="#eedcca"/><circle cx="281" cy="381" r="96" fill="#c54a3b" opacity=".88"/>
  <path d="M232 91L357 529L116 450Z" fill="#e7a836" opacity=".7"/><path d="M93 248L669 410M195 79L624 492" stroke="#272b31" strokeWidth="5"/><path d="M183 472C341 79 543 88 663 216" stroke="#242830" strokeWidth="9" fill="none"/>
  <path d="M109 304Q122 250 151 258T193 242M576 465l27-26 26 26 26-26" stroke="#272b31" strokeWidth="4" fill="none"/><circle cx="636" cy="143" r="18" fill="#c54a3b"/><circle cx="429" cy="477" r="24" fill="#272b31"/>
 </>;
 case 'T5': return <>
  <defs><pattern id="dna-memphis-dots" width="19" height="19" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.3" fill="#28212b"/></pattern></defs>
  <rect x="116" y="84" width="252" height="217" fill="#eb8d9f" stroke="#28212b" strokeWidth="3" transform="rotate(-11 242 192)"/><circle cx="539" cy="247" r="132" fill="#ebc940" stroke="#28212b" strokeWidth="3"/><circle cx="539" cy="247" r="74" fill="#fff5eb" stroke="#28212b" strokeWidth="3"/>
  <path d="M196 326L602 517L118 528Z" fill="#4c76b6" stroke="#28212b" strokeWidth="3"/><path d="M339 357H503V537H339Z" fill="url(#dna-memphis-dots)"/>
  <path d="M71 339l33-29 33 29 33-29M540 73l28 35 28-35 28 35 28-35M579 426l31-25 31 25 31-25" stroke="#28212b" strokeWidth="7" fill="none"/><path d="M252 152L292 201L258 225" stroke="#fff5eb" strokeWidth="8" fill="none"/>
 </>;
 case 'T6': return <>
  <defs><radialGradient id="dna-light-disc" cx=".32" cy=".25" r=".8"><stop stopColor="#f4f4eb"/><stop offset=".45" stopColor="#bbbeb9"/><stop offset=".78" stopColor="#5d6567"/><stop offset="1" stopColor="#202326"/></radialGradient><linearGradient id="dna-light-beam" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f5f4e9" stopOpacity=".6"/><stop offset="1" stopColor="#d6dcd5" stopOpacity="0"/></linearGradient></defs>
  <path d="M111 505L522 69L691 158L258 552Z" fill="url(#dna-light-beam)"/><circle cx="376" cy="292" r="181" fill="url(#dna-light-disc)"/><circle cx="376" cy="292" r="118" fill="#202326"/><circle cx="376" cy="292" r="153" fill="none" stroke="#d4d7d0"/>
  <path d="M163 122H574V505H163Z" stroke="#b4bcb8" strokeWidth="2" fill="none"/><path d="M105 292H665M376 60V553" stroke="#87928d"/><path d="M563 397H643V477H563Z" fill="#ee8054"/>
  <path d="M106 83H137M121 68V98M650 530H681M665 515V545" stroke="#f2f1e8" strokeWidth="2"/><circle cx="258" cy="163" r="15" fill="#f3f2e9"/>
 </>;
 case 'T7': return <>
  <circle cx="411" cy="294" r="191" fill="#e4e5db"/><path d="M239 141C122 207 124 424 303 477C463 526 608 391 594 256" fill="none" stroke="#2c3330" strokeWidth="29" strokeLinecap="square"/>
  <path d="M236 139C163 186 130 303 171 385" fill="none" stroke="#62695f" strokeWidth="8" opacity=".6"/><path d="M205 143L197 165M190 170L179 198M174 209L168 238M164 257L165 285" stroke="#f3f1e8" strokeWidth="3" opacity=".7"/>
  <path d="M297 177H583V438H297Z" stroke="#8c9486" fill="none"/><path d="M270 465L565 153" stroke="#aeb4a3" strokeWidth="2"/><path d="M545 434H596V485H545Z" fill="#a14432"/><path d="M554 443H586M564 443V475M554 458H586M578 458V475" stroke="#f3f1e8" strokeWidth="3"/>
  <path d="M650 138V286M642 138H659M642 286H659" stroke="#929589" fill="none"/>
 </>;
 case 'T8': return <>
  <defs><linearGradient id="dna-paper-white" x2="1" y2="1"><stop stopColor="#fffffd"/><stop offset="1" stopColor="#f0f0e9"/></linearGradient><radialGradient id="dna-paper-shadow"><stop stopColor="#9fa397" stopOpacity=".15"/><stop offset="1" stopColor="#9fa397" stopOpacity="0"/></radialGradient></defs>
  <ellipse cx="422" cy="457" rx="199" ry="28" fill="url(#dna-paper-shadow)"/><path d="M264 154L556 144L543 442L275 432Z" fill="url(#dna-paper-white)" stroke="#e5e5df"/>
  <path d="M275 432L543 442L556 144" stroke="#d9dcd1" fill="none" strokeWidth="1.5"/><circle cx="412" cy="296" r="21" fill="#e5e8dd"/><circle cx="408" cy="292" r="20" fill="#f2f3eb"/>
 </>;
 }
}
export default function Motif({type,className=''}:{type:TypeId;className?:string}) {
 return <svg className={className} width="800" height="620" viewBox="0 0 800 620" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{motifShapes(type)}</svg>;
}
