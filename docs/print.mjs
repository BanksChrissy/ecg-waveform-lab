import {MAIN_COLUMN,RIGHT_COLUMN} from './layout.mjs?v=8';
export function createPrintSVG(model,state){
 const extras=RIGHT_COLUMN.filter(l=>state.extras.includes(l)),columns=extras.length?2:1,duration=state.duration;
 const width=263,height=197,rowH=12,top=10,plotW=columns===2?125:250,speed=Math.min(state.speed,plotW/duration),traceW=speed*duration;
 const main=MAIN_COLUMN.filter(l=>!['V7','V8','V9'].includes(l)||state.extras.includes(l));
 const leads=[...main,...extras],samples=new Map();let span=0;
 for(const lead of leads){const points=[];let min=0,max=0;for(let j=0;j<=duration*1000;j++){const t=j/1000,v=model.value(lead,t);if(!Number.isFinite(v))throw Error('Restore invalid formulas before printing.');points.push([t,v]);min=Math.min(min,v);max=Math.max(max,v);}samples.set(lead,{points,min,max});span=Math.max(span,max-min);}
 const gain=[5,2.5,1,.5,.25,.1,.05,.01].find(g=>g<=state.gain&&g*Math.max(span,1)<=10)||.01;
 const n=x=>Number(x.toFixed(4)),esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}" role="img" aria-label="Single-page calibrated ECG printout"><defs><pattern id="small" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M 1 0 H 0 V 1" fill="none" stroke="#edc0c5" stroke-width=".07"/></pattern><pattern id="large" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="url(#small)"/><path d="M 5 0 H 0 V 5" fill="none" stroke="#d996a0" stroke-width=".15"/></pattern></defs><rect width="263" height="197" fill="white"/><g fill="#111" font-family="Arial,sans-serif"><text x="0" y="3" font-size="2.8" font-weight="bold">ECG WAVEFORM LAB — SYNTHETIC ECG</text><text x="263" y="3" text-anchor="end" font-size="2.4">${state.params.hr} bpm · ${duration} s / lead · ${speed} mm/s · ${gain} mm/mV</text><text x="0" y="7" font-size="2.1">1 small box = ${n(1000/speed)} ms × ${n(1/gain)} mV | Print landscape, Actual size / 100%, headers and footers OFF</text></g>`;
 for(let row=0;row<15;row++)for(let col=0;col<columns;col++){
  const lead=col===0?main[row]:RIGHT_COLUMN[row];if(!lead||!samples.has(lead))continue;
  const {points,min,max}=samples.get(lead),x=col*(width/2)+6,y=top+row*rowH,zero=y+rowH/2+(max+min)*gain/2;
  svg+=`<rect x="${x}" y="${y}" width="${traceW}" height="${rowH}" fill="url(#large)"/><text x="${x-1}" y="${y+3}" text-anchor="end" font-family="Arial" font-size="2.3" font-weight="bold">${esc(lead)}</text><path d="M ${x-2} ${n(zero)} h 2" stroke="#111" stroke-width=".2"/><path d="${points.map(([t,v],i)=>`${i?'L':'M'}${n(x+t*speed)},${n(zero-v*gain)}`).join(' ')}" fill="none" stroke="#111" stroke-width=".22" stroke-linejoin="round" stroke-linecap="round"/>`;
 }
 svg+=`<g stroke="#111" fill="none" stroke-width=".2"><path d="M 1 195 h 20 m -20 -1 v 2 m 20 -2 v 2"/><path d="M 37 196 h 2 v -${gain} h ${speed*.2} v ${gain} h 2"/></g><g fill="#111" font-family="Arial" font-size="2"><text x="1" y="193">Ruler check: 20 mm</text><text x="54" y="195">Calibration: 1 mV × 200 ms</text><text x="263" y="195" text-anchor="end">${columns===2?'Two columns · ':''}Zero level marked at each trace | Illustrative waveforms</text></g></svg>`;
 return {svg,width,height,speed,gain};
}
