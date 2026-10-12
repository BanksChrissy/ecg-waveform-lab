export const STANDARD_LEADS=['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6'];
export const RIGHT=['V1R','V2R','V3R','V4R','V5R','V6R'];
export const POSTERIOR=['V7','V8','V9'];
export const RIGHT_POSTERIOR=['V7R','V8R','V9R'];
export const EXTRA_LEADS=[...RIGHT,...POSTERIOR,...RIGHT_POSTERIOR];
export const LEADS=[...STANDARD_LEADS,...EXTRA_LEADS];
export const PAIRED=[['II','aVL'],['III','I'],['aVF',null],[null,'V1'],[null,'V2'],[null,'V3'],['V4',null],['V5',null],['V6',null],['aVR',null]];
export const STANDARD=[['I','aVR','V1','V4'],['II','aVL','V2','V5'],['III','aVF','V3','V6']];
export const DEFAULTS={hr:60,axis:60,width:1,pGain:1,tGain:1};
const D=(v,d=0,d2=0)=>({v,d,d2});
const add=(a,b)=>D(a.v+b.v,a.d+b.d,a.d2+b.d2);
const neg=a=>D(-a.v,-a.d,-a.d2);
const mul=(a,b)=>D(a.v*b.v,a.d*b.v+a.v*b.d,a.d2*b.v+2*a.d*b.d+a.v*b.d2);
function unary(a,f,fp,fpp){return D(f(a.v),fp(a.v)*a.d,fpp(a.v)*a.d*a.d+fp(a.v)*a.d2);}
const exp=a=>unary(a,Math.exp,Math.exp,Math.exp);
const log=a=>unary(a,Math.log,x=>1/x,x=>-1/(x*x));
function pow(a,b){if(b.d===0&&b.d2===0){if(b.v===0)return D(1);if(b.v===1)return a;return unary(a,x=>Math.pow(x,b.v),x=>b.v*Math.pow(x,b.v-1),x=>b.v*(b.v-1)*Math.pow(x,b.v-2));}return exp(mul(b,log(a)));}
const div=(a,b)=>mul(a,pow(b,D(-1)));
const sin=a=>unary(a,Math.sin,Math.cos,x=>-Math.sin(x));
const cos=a=>unary(a,Math.cos,x=>-Math.sin(x),x=>-Math.cos(x));
const tanh=a=>unary(a,Math.tanh,x=>1-Math.tanh(x)**2,x=>-2*Math.tanh(x)*(1-Math.tanh(x)**2));
const gauss=(x,c,w)=>exp(mul(D(-.5),pow(div(add(x,neg(c)),w),D(2))));
const FUNCTIONS={sin:[1,sin],cos:[1,cos],tan:[1,a=>div(sin(a),cos(a))],exp:[1,exp],ln:[1,log],log:[1,log],sqrt:[1,a=>pow(a,D(.5))],abs:[1,a=>a.v===0?D(0,NaN,NaN):a.v<0?neg(a):a],tanh:[1,tanh],gauss:[3,gauss],min:[2,(a,b)=>a.v===b.v?D(a.v,NaN,NaN):a.v<b.v?a:b],max:[2,(a,b)=>a.v===b.v?D(a.v,NaN,NaN):a.v>b.v?a:b]};
const VARS=new Set(['t','u','T','y','P','Q','R','S','W','pi','e']);
export function parseFormula(source){
 if(typeof source!=='string'||source.length>1200)throw Error('Keep formulas under 1,200 characters.');
 let pos=0;const tokens=[];const re=/\s*(?:(\d*\.\d+|\d+\.?\d*)([eE][+-]?\d+)?|([A-Za-z_][A-Za-z_0-9]*)|(\*\*|[+\-*/^(),]))/y;
 while(pos<source.length){if(!source.slice(pos).trim())break;re.lastIndex=pos;const m=re.exec(source);if(!m)throw Error('Unexpected character at position '+(pos+1));tokens.push(m[1]?{type:'num',v:Number(m[1]+(m[2]||''))}:m[3]?{type:'id',v:m[3]}:{type:m[4]==='**'?'^':m[4]});pos=re.lastIndex;}
 let i=0;const take=t=>tokens[i]?.type===t?tokens[i++]:null;const need=t=>{if(!take(t))throw Error('Expected '+t);};
 function primary(){let n=take('num');if(n)return {kind:'number',v:n.v};let id=take('id');if(id){if(take('(')){if(!FUNCTIONS[id.v])throw Error('Unknown function: '+id.v);let args=[sum()];while(take(','))args.push(sum());need(')');if(args.length!==FUNCTIONS[id.v][0])throw Error(id.v+' needs '+FUNCTIONS[id.v][0]+' arguments.');return {kind:'call',name:id.v,args};}if(!VARS.has(id.v))throw Error('Unknown variable: '+id.v);return {kind:'var',name:id.v};}if(take('(')){const x=sum();need(')');return x;}throw Error('Expected a number, variable, or parenthesis.');}
 function power(){let a=primary();if(take('^'))a={kind:'op',op:'^',a,b:unaryExpr()};return a;}
 function unaryExpr(){if(take('+'))return unaryExpr();if(take('-'))return {kind:'neg',a:unaryExpr()};return power();}
 function product(){let a=unaryExpr();while(tokens[i]&&['*','/'].includes(tokens[i].type)){const op=tokens[i++].type;a={kind:'op',op,a,b:unaryExpr()};}return a;}
 function sum(){let a=product();while(tokens[i]&&['+','-'].includes(tokens[i].type)){const op=tokens[i++].type;a={kind:'op',op,a,b:product()};}return a;}
 const ast=sum();if(i!==tokens.length)throw Error('Use * for multiplication, for example 2*y.');return ast;
}
function evaluate(ast,env){if(ast.kind==='number')return D(ast.v);if(ast.kind==='var')return env[ast.name];if(ast.kind==='neg')return neg(evaluate(ast.a,env));if(ast.kind==='call')return FUNCTIONS[ast.name][1](...ast.args.map(x=>evaluate(x,env)));const a=evaluate(ast.a,env),b=evaluate(ast.b,env);return ({'+':add,'-':(x,y)=>add(x,neg(y)),'*':mul,'/':div,'^':pow})[ast.op](a,b);}
function periodic(t,c,w,T){let v=0,d=0,d2=0;const k0=Math.round((t-c)/T),n=Math.max(2,Math.ceil(9*w/T)),ww=w*w;for(let k=k0-n;k<=k0+n;k++){const x=t-c-k*T,z=Math.exp(-.5*x*x/ww);v+=z;d+=-x/ww*z;d2+=(x*x/(ww*ww)-1/ww)*z;}return D(v,d,d2);}
export function components(t,p){const T=60/p.hr,r=.35*T;return {P:periodic(t,.16*T,.032*T,T),Q:periodic(t,r-.026*p.width,.009*p.width,T),R:periodic(t,r,.011*p.width,T),S:periodic(t,r+.032*p.width,.012*p.width,T),W:periodic(t,.65*T,.06*T,T)};}
function base(lead,t,p,parts){const c=parts||components(t,p);let a;if(lead==='I'||lead==='II'){const theta=lead==='I'?0:60,project=axis=>Math.cos((theta-axis)*Math.PI/180);a=[.13*project(50),-.08*project(p.axis),1.05*project(p.axis),-.22*project(p.axis+35),.3*project(40)];}else a={V1:[.04,0,.18,-.85,-.06],V2:[.07,-.015,.42,-1,.18],V3:[.09,-.02,.8,-.7,.36],V4:[.1,-.035,1.2,-.36,.42],V5:[.1,-.055,1.05,-.17,.34],V6:[.08,-.055,.86,-.07,.26],V1R:[.07,-.015,.42,-1,.18],V2R:[.04,0,.18,-.85,-.06],V3R:[.035,0,.16,-.6,-.05],V4R:[.03,0,.12,-.38,-.03],V5R:[.025,0,.09,-.24,-.02],V6R:[.02,0,.07,-.15,-.01],V7:[.06,-.025,.58,-.045,.2],V8:[.04,-.02,.4,-.03,.14],V9:[.03,-.015,.27,-.02,.1],V7R:[.018,0,.065,-.09,.015],V8R:[.015,0,.055,-.06,.015],V9R:[.012,0,.045,-.04,.01]}[lead];a=[...a];a[0]*=p.pGain;a[4]*=p.tGain;return Object.values(c).reduce((s,v,i)=>add(s,mul(D(a[i]),v)),D(0));}
export const WAVE_KEYS=['P','Q','R','S','W'];
export function waveSettings(params,lead,shape={}){
 const p={...DEFAULTS,...params},T=60/p.hr,r=.35*T,centers=[.16*T,r-.026*p.width,r,r+.032*p.width,.65*T],widths=[.032*T,.009*p.width,.011*p.width,.012*p.width,.06*T];
 return Object.fromEntries(WAVE_KEYS.map((key,j)=>{
  const basis=Object.fromEntries(WAVE_KEYS.map(k=>[k,D(k===key?1:0)]));
  const i=base('I',0,p,basis).v,ii=base('II',0,p,basis).v;
  const amplitude=lead==='III'?ii-i:lead==='aVR'?-(i+ii)/2:lead==='aVL'?i-ii/2:lead==='aVF'?ii-i/2:base(lead,0,p,basis).v;
  const edit=shape.waves?.[key]||{};
  return [key,{amplitude:edit.amplitude??amplitude,center:centers[j]+(edit.shift||0),width:widths[j]*(edit.widthFactor??1),originalAmplitude:amplitude,originalCenter:centers[j],originalWidth:widths[j],shift:edit.shift||0,widthFactor:edit.widthFactor??1}];
 }));
}
export function validateShapes(shapes={}){if(!shapes||typeof shapes!=='object'||Array.isArray(shapes))throw Error('Invalid waveform edits.');for(const [lead,shape] of Object.entries(shapes)){if(!LEADS.includes(lead)||!shape||typeof shape!=='object')throw Error('Invalid waveform lead.');for(const [key,min,max]of [['gain',.1,3],['baseline',-2,2]])if(shape[key]!==undefined&&(!Number.isFinite(shape[key])||shape[key]<min||shape[key]>max))throw Error('Invalid '+key);if(shape.waves!==undefined&&(!shape.waves||typeof shape.waves!=='object'||Array.isArray(shape.waves)))throw Error('Invalid wave edits.');for(const [wave,edit]of Object.entries(shape.waves||{})){if(!WAVE_KEYS.includes(wave)||!edit||typeof edit!=='object')throw Error('Invalid wave.');for(const [key,min,max]of [['amplitude',-3,3],['shift',-.2,.2],['widthFactor',.25,4]])if(edit[key]!==undefined&&(!Number.isFinite(edit[key])||edit[key]<min||edit[key]>max))throw Error('Invalid '+wave+' '+key);}}return true;}
export function compileModel(params=DEFAULTS,formulas={},linked=true,shapes={},ectopy=[]){const p={...DEFAULTS,...params},T=60/p.hr;const asts=Object.fromEntries(LEADS.map(l=>[l,parseFormula(formulas[l]||'y')]));const cache=new Map();const partsAt=t=>{if(cache.has(t))return cache.get(t);const c=components(t,p);if(cache.size>25000)cache.clear();cache.set(t,c);return c;};const phase=t=>{const u=((t%T)+T)%T;return D(u,Math.min(u,T-u)<1e-12?NaN:1,Math.min(u,T-u)<1e-12?NaN:0);};
 const settings=Object.fromEntries(Object.keys(shapes).map(l=>[l,waveSettings(p,l,shapes[l])]));
 function shaped(l,t,signal){const shape=shapes[l];if(!shape)return signal;for(const key of Object.keys(shape.waves||{})){const w=settings[l][key];signal=add(signal,add(mul(D(w.amplitude),periodic(t,w.center,w.width,T)),mul(D(-w.originalAmplitude),periodic(t,w.originalCenter,w.originalWidth,T))));}return add(mul(D(shape.gain??1),signal),D(shape.baseline??0));}
 function independent(l,t,parts){const c=parts||partsAt(t);return shaped(l,t,evaluate(asts[l],{...c,t:D(t,1),u:phase(t),T:D(T),y:base(l,t,p,c),pi:D(Math.PI),e:D(Math.E)}));}
 function regularSample(l,t){const c=partsAt(t),i=()=>independent('I',t,c),ii=()=>independent('II',t,c);if(!['III','aVR','aVL','aVF'].includes(l))return independent(l,t,c);const derive=()=>l==='III'?add(ii(),neg(i())):l==='aVR'?mul(D(-.5),add(i(),ii())):l==='aVL'?add(i(),mul(D(-.5),ii())):add(ii(),mul(D(-.5),i()));if(linked)return derive();const bi=base('I',t,p,c),bii=base('II',t,p,c);const by=l==='III'?add(bii,neg(bi)):l==='aVR'?mul(D(-.5),add(bi,bii)):l==='aVL'?add(bi,mul(D(-.5),bii)):add(bii,mul(D(-.5),bi));return shaped(l,t,evaluate(asts[l],{...c,t:D(t,1),u:phase(t),T:D(T),y:by,pi:D(Math.PI),e:D(Math.E)}));}
 const eventSettings=ectopy.map(event=>({event,leads:Object.fromEntries(LEADS.map(l=>[l,ectopicWaveSettings(p,l,event)])),normal:Object.fromEntries(LEADS.map(l=>[l,waveSettings(p,l,shapes[l])]))}));
 function pulse(t,c,w){const x=t-c,z=Math.exp(-.5*x*x/(w*w));return D(z,-x/(w*w)*z,(x*x/w**4-1/(w*w))*z);}
 function withEvents(l,t){let signal=regularSample(l,t);for(const {event,leads,normal}of eventSettings){const shape=event.shapes?.[l]||{},normalGain=shapes[l]?.gain??1;for(const key of WAVE_KEYS){const w=normal[l][key];for(const beat of [event.beat,...(event.skipNext?[event.beat+1]:[])])signal=add(signal,mul(D(-w.amplitude*normalGain),pulse(t,w.center+beat*T,w.width)));const v=leads[l][key];signal=add(signal,mul(D(v.amplitude*(shape.gain??1)),pulse(t,v.center,v.width)));}signal=add(signal,mul(D(shape.baseline??0),pulse(t,event.time,.1)));}return signal;}
 function sample(l,t){if(linked&&['III','aVR','aVL','aVF'].includes(l)){const i=withEvents('I',t),ii=withEvents('II',t);return l==='III'?add(ii,neg(i)):l==='aVR'?mul(D(-.5),add(i,ii)):l==='aVL'?add(i,mul(D(-.5),ii)):add(ii,mul(D(-.5),i));}return withEvents(l,t);}
 return {params:p,sample,value:(l,t)=>sample(l,t).v};
}
export function integrate(fn,a,b,tol=1e-7){if(a===b)return 0;if(b<a)return -integrate(fn,b,a,tol);let sum=0;const panels=Math.max(1,Math.ceil((b-a)/.01));function adapt(a,b,fa,fm,fb,whole,eps,depth){const m=(a+b)/2,l=(a+m)/2,r=(m+b)/2,fl=fn(l),fr=fn(r);if(![fa,fm,fb,fl,fr].every(Number.isFinite))return NaN;const left=(m-a)/6*(fa+4*fl+fm),right=(b-m)/6*(fm+4*fr+fb),delta=left+right-whole;if(depth<=0||Math.abs(delta)<15*eps)return left+right+delta/15;return adapt(a,m,fa,fl,fm,left,eps/2,depth-1)+adapt(m,b,fm,fr,fb,right,eps/2,depth-1);}
 for(let j=0;j<panels;j++){const x=a+(b-a)*j/panels,y=a+(b-a)*(j+1)/panels,m=(x+y)/2,fa=fn(x),fm=fn(m),fb=fn(y);sum+=adapt(x,y,fa,fm,fb,(y-x)/6*(fa+4*fm+fb),tol/panels,12);}return sum;}
export function validateModel(model,duration=10,leads=LEADS){for(const l of leads)for(let n=0;n<=Math.ceil(duration*500);n++){const s=model.sample(l,n/500);if(!Number.isFinite(s.v)||Math.abs(s.v)>100)throw Error(l+': formula becomes undefined or exceeds ±100 mV near '+(n/500).toFixed(3)+' s.');}return true;}

// Ectopy presets are editable illustrative morphologies, not diagnostic templates.
export function ectopicWaveSettings(params,lead,event){
 const T=60/params.hr,normal=waveSettings(params,lead),shape=event.shapes?.[lead]||{};
 return Object.fromEntries(WAVE_KEYS.map(key=>{const n=normal[key],vent=event.type==='PVC',junction=event.type==='PJC';
 const amplitude=key==='P'?(vent?0:junction?-.06:n.amplitude*.7):key==='W'&&vent?-n.amplitude:n.amplitude;
 const width=n.width*(vent&&['Q','R','S'].includes(key)?2.5:1),center=event.time+(n.center-.35*T)*(vent&&['Q','S'].includes(key)?2.5:1),edit=shape.waves?.[key]||{};
 return [key,{amplitude:edit.amplitude??amplitude,center:center+(edit.shift||0),width:width*(edit.widthFactor??1),originalAmplitude:amplitude,originalCenter:center,originalWidth:width,shift:edit.shift||0,widthFactor:edit.widthFactor??1}];}));
}
export function validateEctopy(events=[]){
 if(!Array.isArray(events)||events.length>50)throw Error('Use up to 50 ectopic beats.');const occupied=new Set();
 for(const e of events){if(!['PAC','PJC','PVC'].includes(e.type)||!Number.isInteger(e.beat)||e.beat<0||e.beat>50||!Number.isFinite(e.time)||e.time<0||e.time>10||typeof e.skipNext!=='boolean')throw Error('Invalid ectopic beat.');validateShapes(e.shapes||{});for(const b of [e.beat,...(e.skipNext?[e.beat+1]:[])]){if(occupied.has(b))throw Error('Two ectopic events cannot replace the same beat.');occupied.add(b);}}return true;
}
