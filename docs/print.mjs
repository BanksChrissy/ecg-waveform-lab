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

// Fixed landscape Letter page; all coordinates below are physical millimeters.
export function createPrintPDF(model,state){
 const {speed,gain}=createPrintSVG(model,state),right=RIGHT_COLUMN.filter(l=>state.extras.includes(l));
 const main=MAIN_COLUMN.filter(l=>!['V7','V8','V9'].includes(l)||state.extras.includes(l)),cols=right.length?2:1;
 const scale=72/25.4,H=612,commands=[],n=v=>Number(v.toFixed(4));
 const xy=(x,y)=>`${n((x+8)*scale)} ${n(H-(y+8)*scale)}`;
 const line=(x,y,x2,y2)=>commands.push(`${xy(x,y)} m ${xy(x2,y2)} l S`);
 const ink=()=>commands.push('0.06 0.06 0.06 RG 0.06 0.06 0.06 rg');
 const text=(x,y,size,str)=>{const escaped=String(str).replace(/[^\x20-\x7e]/g,'-').replace(/[\\()]/g,'\\$&');commands.push(`BT /F1 ${n(size*scale)} Tf 1 0 0 1 ${xy(x,y)} Tm (${escaped}) Tj ET`);};
 ink();text(0,3,2.8,'ECG WAVEFORM LAB - SYNTHETIC ECG');text(154,3,2.3,`${state.params.hr} bpm | ${state.duration} s/lead | ${speed} mm/s | ${gain} mm/mV`);
 text(0,7,2.1,`1 mm = ${n(1000/speed)} ms x ${n(1/gain)} mV | Landscape Letter or A4 | Print Actual size / 100%`);
 for(let row=0;row<15;row++)for(let col=0;col<cols;col++){
  const lead=col===0?main[row]:RIGHT_COLUMN[row];if(!lead||col===1&&!right.includes(lead))continue;
  const x=col*131.5+6,y=10+row*12,w=speed*state.duration,points=[];let min=0,max=0;
  for(let j=0;j<=state.duration*1000;j++){const t=j/1000,v=model.value(lead,t);points.push([t,v]);min=Math.min(min,v);max=Math.max(max,v);}
  for(let major=0;major<2;major++){
   commands.push(major?'0.85 0.59 0.63 RG':'0.93 0.75 0.77 RG',`${n((major?.15:.07)*scale)} w`);
   for(let u=0;u<=w;u++)if((u%5===0)===!!major)line(x+u,y,x+u,y+12);
   for(let v=0;v<=12;v++)if((v%5===0)===!!major)line(x,y+v,x+w,y+v);
  }
  const zero=y+6+(max+min)*gain/2;ink();text(x-6,y+3,2.1,lead);commands.push(`${n(.22*scale)} w 1 J 1 j`);line(x-2,zero,x,zero);
  commands.push(points.map(([t,v],i)=>`${xy(x+t*speed,zero-v*gain)} ${i?'l':'m'}`).join('\n')+'\nS');
 }
 ink();commands.push(`${n(.2*scale)} w`);line(1,195,21,195);line(1,194,1,196);line(21,194,21,196);text(1,192,2,'Ruler check: 20 mm');
 const pulse=[[37,196],[39,196],[39,196-gain],[39+speed*.2,196-gain],[39+speed*.2,196],[41+speed*.2,196]];
 commands.push(pulse.map(([x,y],i)=>`${xy(x,y)} ${i?'l':'m'}`).join('\n')+'\nS');text(54,195,2,'Calibration: 1 mV x 200 ms');text(175,195,2,'Zero marked at each trace | Synthetic ECG');
 const stream=commands.join('\n'),objects=[`<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /PrintScaling /None >> >>`,`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
 let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});const start=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
 return pdf;
}
