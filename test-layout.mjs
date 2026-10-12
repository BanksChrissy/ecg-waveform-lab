import assert from 'node:assert/strict';
import {LEADS,STANDARD_LEADS,EXTRA_LEADS,PAIRED,compileModel} from './docs/engine.mjs';
import {MAIN_COLUMN,RIGHT_COLUMN,DEFAULT_ORDER,activeLeads,leadRows,migrateSession,validateLeadSelection} from './docs/layout.mjs';
for(let mask=0;mask<4096;mask++){
 const extras=EXTRA_LEADS.filter((_,i)=>mask&(1<<i));
 for(const layout of ['columns','stacked','paired','standard','custom']){
  const rows=leadRows(layout,extras,PAIRED),visible=rows.flat().filter(Boolean);
  assert.equal(visible.length,15+extras.filter(l=>!MAIN_COLUMN.includes(l)).length);
  assert.equal(new Set(visible).size,visible.length);
  for(const l of [...STANDARD_LEADS,...extras])assert.ok(visible.includes(l));
  if(layout==='stacked'){assert.equal(rows.length,15+extras.filter(l=>!MAIN_COLUMN.includes(l)).length);assert.ok(rows.every(r=>r.length===1));}
 }
}
const m=compileModel(undefined,{V4R:'2*y',V8:'0.2*sin(2*pi*t)'},true);
assert.ok(Number.isFinite(m.sample('V4R',.35).v));
assert.ok(Math.abs(m.sample('V8',.2).d-.4*Math.PI*Math.cos(.4*Math.PI))<1e-12);
const old={version:1,layout:'paired',formulas:{II:'2*y'},selected:'II'},migrated=migrateSession(old);
assert.equal(migrated.version,3);assert.equal(migrated.layout,'columns');assert.equal(migrated.formulas.II,'2*y');validateLeadSelection(migrated);
assert.equal(activeLeads(EXTRA_LEADS).length,24);
assert.deepEqual(leadRows('stacked',EXTRA_LEADS,PAIRED,[...LEADS].reverse()).flat(),[...LEADS].reverse());
assert.throws(()=>validateLeadSelection({...migrated,selected:'V4R'}));
console.log('PASS: all 4,096 extra-lead selections across five layouts, 15-lead minimum, ordering, migration, and editable extended signals.');

assert.deepEqual(leadRows('columns').flat(),MAIN_COLUMN);
assert.deepEqual(leadRows('columns',RIGHT_COLUMN).map(r=>r[0]),MAIN_COLUMN);
assert.deepEqual(leadRows('columns',RIGHT_COLUMN).map(r=>r[1]).filter(Boolean),RIGHT_COLUMN);
assert.deepEqual(leadRows('columns',['V4R'])[6],['V3','V4R']);
assert.deepEqual(activeLeads(RIGHT_COLUMN),DEFAULT_ORDER);
console.log('PASS: exact main and right-column orders, fixed optional positions, and 15-lead default.');
