import assert from 'node:assert/strict';
import {LEADS,DEFAULTS,WAVE_KEYS,waveSettings,validateShapes,compileModel,integrate} from './docs/engine.mjs';
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const baseline=compileModel(DEFAULTS,{},false);
for(const lead of LEADS){
 const settings=waveSettings(DEFAULTS,lead);
 for(const key of WAVE_KEYS){
  const w=settings[key],shapes={[lead]:{waves:{[key]:{amplitude:w.amplitude+.25,shift:.035,widthFactor:1.4}}}};
  validateShapes(shapes);const m=compileModel(DEFAULTS,{},false,shapes),t=w.center+.035;
  assert.ok(Math.abs(m.value(lead,t)-baseline.value(lead,t))>1e-6);
  for(const other of LEADS.filter(l=>l!==lead))close(m.value(other,.35),baseline.value(other,.35));
  const h=1e-6,s=m.sample(lead,t+.01);
  close(s.d,(m.value(lead,t+.01+h)-m.value(lead,t+.01-h))/(2*h),1e-5);
  close(s.d2,(m.sample(lead,t+.01+h).d-m.sample(lead,t+.01-h).d)/(2*h),1e-3);
  close(m.value(lead,t),m.value(lead,t+1));
 }
 const identity=compileModel(DEFAULTS,{},false,{[lead]:{waves:Object.fromEntries(WAVE_KEYS.map(k=>[k,{amplitude:settings[k].amplitude,shift:0,widthFactor:1}]))}});
 for(const t of [.01,.16,.32,.35,.5,.65])close(identity.value(lead,t),baseline.value(lead,t));
 const scale=compileModel(DEFAULTS,{},false,{[lead]:{gain:2,baseline:.1}});close(scale.value(lead,.35),baseline.value(lead,.35)*2+.1);
}
const linked=compileModel(DEFAULTS,{},true,{II:{waves:{R:{amplitude:1.8,shift:.02,widthFactor:2}}}});
for(const t of [.1,.35,.37,.6])close(linked.value('II',t),linked.value('I',t)+linked.value('III',t));
const formulas={V4R:'0.1*sin(2*pi*t)'},shapes={V4R:{waves:{R:{amplitude:.8}},gain:1.5,baseline:.1}};
const withFormula=compileModel(DEFAULTS,formulas,false,shapes);assert.ok(Number.isFinite(integrate(t=>withFormula.value('V4R',t),0,1)));
const frozen=JSON.parse(JSON.stringify(shapes));const t=.35,current=withFormula.value('V4R',t),target=current+.2,amp=shapes.V4R.waves.R.amplitude;
shapes.V4R.waves.R.amplitude=amp+.01;const probe=compileModel(DEFAULTS,formulas,false,shapes).value('V4R',t);
shapes.V4R.waves.R.amplitude=amp+(target-current)/((probe-current)/.01);close(compileModel(DEFAULTS,formulas,false,shapes).value('V4R',t),target);
validateShapes(JSON.parse(JSON.stringify(shapes)));assert.throws(()=>validateShapes({V4R:{waves:{R:{widthFactor:0}}}}));
assert.throws(()=>validateShapes({V4R:{baseline:NaN}}));
console.log('PASS: all 24 leads × 5 wave edits; isolation, resets, derivatives, linked identities, formula composition, drag voltage solve, and serialized shapes.');
