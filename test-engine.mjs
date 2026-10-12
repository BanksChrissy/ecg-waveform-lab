import assert from 'node:assert/strict';
import {LEADS,PAIRED,DEFAULTS,compileModel,parseFormula,integrate,validateModel} from './docs/engine.mjs';
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
const m=compileModel();
assert.equal(new Set(PAIRED.flat().filter(Boolean)).size,12);
for(let t=0;t<=10;t+=.0137){
 const i=m.sample('I',t),ii=m.sample('II',t),iii=m.sample('III',t);
 for(const field of ['v','d','d2']){
  close(i[field]+iii[field],ii[field],1e-10);
  close(m.sample('aVR',t)[field],-(i[field]+ii[field])/2);
  close(m.sample('aVL',t)[field],i[field]-ii[field]/2);
  close(m.sample('aVF',t)[field],ii[field]-i[field]/2);
 }
}
for(const l of LEADS)for(const t of [.05,.19,.35,.52,.81]){
 const s=m.sample(l,t),h=1e-6;
 close(s.v,m.value(l,t+1),1e-12);
 close(s.d,(m.value(l,t+h)-m.value(l,t-h))/(2*h),1e-5);
 close(s.d2,(m.sample(l,t+h).d-m.sample(l,t-h).d)/(2*h),1e-3);
}
const polynomial=compileModel(DEFAULTS,{II:'t^3 - 2*t + 1'});
for(const t of [0,.2,1,2]){const s=polynomial.sample('II',t);close(s.v,t**3-2*t+1);close(s.d,3*t*t-2);close(s.d2,6*t);}
close(integrate(t=>polynomial.value('II',t),0,2),2,1e-8);
close(integrate(t=>polynomial.value('II',t),2,0),-2,1e-8);
close(integrate(Math.sin,0,Math.PI),2,1e-8);
close(integrate(t=>Math.exp(-t*t/2),-8,8),Math.sqrt(2*Math.PI),1e-7);
const trig=compileModel(DEFAULTS,{V2:'sin(2*pi*t)'});
for(const t of [0,.2,.8]){const s=trig.sample('V2',t);close(s.d,2*Math.PI*Math.cos(2*Math.PI*t));close(s.d2,-4*Math.PI**2*Math.sin(2*Math.PI*t));}
close(compileModel(DEFAULTS,{II:'-2^2'}).value('II',0),-4);
close(compileModel(DEFAULTS,{II:'2^3^2'}).value('II',0),512);
close(compileModel(DEFAULTS,{II:'2^-2'}).value('II',0),.25);
const changed=compileModel(DEFAULTS,{II:'2*y'});
close(changed.value('III',.35),2*m.value('II',.35)-m.value('I',.35));
close(compileModel(DEFAULTS,{III:'2*y'},false).value('III',.35),2*m.value('III',.35));
close(compileModel(DEFAULTS,{III:'2*y'},true).value('III',.35),m.value('III',.35));
assert.throws(()=>parseFormula('globalThis.location'));
assert.throws(()=>parseFormula('y;alert(1)'));
assert.throws(()=>parseFormula('2y'));
assert.throws(()=>parseFormula('gauss(t,0)'));
assert.throws(()=>validateModel(compileModel(DEFAULTS,{II:'1/(t-.25)'}),1));
assert.ok(Number.isNaN(compileModel(DEFAULTS,{II:'abs(t-.2)'}).sample('II',.2).d));
assert.ok(Number.isNaN(compileModel(DEFAULTS,{II:'u'}).sample('II',1).d));
for(const hr of [30,60,120,180])validateModel(compileModel({...DEFAULTS,hr}),10);
for(const f of ['1.5*y','-y','y + 0.2*exp(-((u-0.47*T)/(0.07*T))^8)','y - 0.5*W','y + 0.03*sin(2*pi*0.3*t)','y + 0.08*gauss(u,0.38*T,0.012)','0.15*P - 0.08*Q + 1.1*R - 0.25*S + 0.3*W'])validateModel(compileModel(DEFAULTS,{II:f}),10);
console.log('PASS: all 12 leads, identities, linked/independent edits, analytic derivatives, quadrature, periodicity, all sample formulas, rate bounds, invalid formulas.');
