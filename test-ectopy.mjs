import assert from 'node:assert/strict';
import {compileModel,DEFAULTS,LEADS,validateEctopy,ectopicWaveSettings} from './docs/engine.mjs';
for(const hr of [30,60,180,300])for(const type of ['PAC','PJC','PVC']){
 const p={...DEFAULTS,hr},T=60/hr,e={type,beat:2,time:2.1*T,skipNext:false,shapes:{}};
 validateEctopy([e]);const m=compileModel(p,{},true,{},[e]);
 for(const l of LEADS)for(const t of [e.time-.02,e.time,e.time+.03]){
  const x=m.sample(l,t),h=1e-6;assert(Number.isFinite(x.v));assert(Math.abs(x.d-(m.value(l,t+h)-m.value(l,t-h))/(2*h))<.001);
  assert(Math.abs(m.value('I',t)+m.value('III',t)-m.value('II',t))<1e-12);
 }
 const changed=structuredClone(e);changed.shapes.V2={waves:{R:{amplitude:2.5,shift:.01,widthFactor:1.3}}};
 const edit=compileModel(p,{},true,{},[changed]);assert.notEqual(edit.value('V2',e.time),m.value('V2',e.time));assert.equal(edit.value('V3',e.time),m.value('V3',e.time));
 assert.equal(ectopicWaveSettings(p,'V2',changed).R.amplitude,2.5);
 const pause={...e,skipNext:true};validateEctopy([pause]);const pm=compileModel(p,{},true,{},[pause]);assert.notEqual(pm.value('II',3.35*T),m.value('II',3.35*T));
}
assert.throws(()=>validateEctopy([{type:'PVC',beat:1,time:1,skipNext:true,shapes:{}},{type:'PAC',beat:2,time:2,skipNext:false,shapes:{}}]));
const plain=compileModel(DEFAULTS),empty=compileModel(DEFAULTS,{},true,{},[]);for(const l of LEADS)assert.equal(plain.value(l,.35),empty.value(l,.35));
console.log('PASS: ectopy presets at 30–300 bpm, derivatives, linked leads, per-event/lead isolation, pause, validation, and unchanged normal traces.');
