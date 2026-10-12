import {STANDARD_LEADS,EXTRA_LEADS,LEADS,PAIRED,STANDARD} from './engine.mjs';
export const MAIN_COLUMN=['aVR','V7','V8','V9','V1','V2','V3','V4','II','III','aVF','aVL','I','V5','V6'];
export const RIGHT_COLUMN=['V7R','V8R','V9R','V1R','V2R','V3R','V4R','V5R','V6R'];
export const DEFAULT_ORDER=[...MAIN_COLUMN,...RIGHT_COLUMN];
export function activeLeads(extras=[],order=DEFAULT_ORDER){return order.filter(l=>STANDARD_LEADS.includes(l)||extras.includes(l));}
export function leadRows(layout,extras=[],custom=PAIRED,order=DEFAULT_ORDER){
 extras=[...new Set(extras)];
 if(layout==='columns'){const show=RIGHT_COLUMN.some(l=>extras.includes(l));return MAIN_COLUMN.filter(l=>STANDARD_LEADS.includes(l)||extras.includes(l)).map((l,i)=>show?[l,extras.includes(RIGHT_COLUMN[i])?RIGHT_COLUMN[i]:null]:[l]);}
 if(layout==='stacked')return activeLeads(extras,order).map(l=>[l]);
 if(layout==='paired'){
  const rows=PAIRED.map(r=>[...r]);
  for(let i=0;i<3;i++){if(extras.includes('V'+(i+7)))rows[i+3][0]='V'+(i+7);if(extras.includes('V'+(i+4)+'R'))rows[i+6][1]='V'+(i+4)+'R';}
  const right=Array.from({length:3},(_,i)=>['V'+(i+7)+'R','V'+(i+1)+'R'].map(l=>extras.includes(l)?l:null)).filter(r=>r.some(Boolean));
  rows.splice(9,0,...right);return rows;
 }
 const rows=(layout==='custom'?custom:STANDARD).map(r=>[...r]),columns=layout==='custom'?2:4,extra=EXTRA_LEADS.filter(l=>extras.includes(l));
 for(let i=0;i<extra.length;i+=columns)rows.push(Array.from({length:columns},(_,j)=>extra[i+j]||null));
 return rows;
}
export function migrateSession(s){if(s&&[1,2].includes(s.version))return {...s,version:3,layout:'columns',extras:s.extras||[],order:[...DEFAULT_ORDER]};return s;}
export function validateLeadSelection(s){if(!Array.isArray(s.extras)||s.extras.some(l=>!EXTRA_LEADS.includes(l))||new Set(s.extras).size!==s.extras.length)throw Error('Invalid extra lead selection.');if(!Array.isArray(s.order)||s.order.length!==LEADS.length||new Set(s.order).size!==LEADS.length||s.order.some(l=>!LEADS.includes(l)))throw Error('Invalid lead order.');if(!activeLeads(s.extras,s.order).includes(s.selected))throw Error('Selected lead is hidden.');}
