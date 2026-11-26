import test from 'node:test';
import assert from 'node:assert/strict';
import { branches, chapters, initialDemo, demoReducer as reduce, chapterFromHash, chapterScene, prototypeURL, prototypeBase, prototypeBaseFor, roleTours, parentLocationVisible, locationVisible, alertLabels } from '../showcase/src/data.js';
import { roles } from '../dist/data.js';

test('Transport story has eight addressable chapters while retaining all twelve system-map roles',()=>{
 assert.deepEqual(chapters.map(c=>c.id),['network','tracker','journey','privacy','alerts','boarding','operations','pilot']);
 assert.equal(branches.length,20);assert.equal(new Set(branches.map(b=>b.id)).size,20);
 assert.deepEqual(roleTours.map(r=>r.id).sort(),Object.keys(roles).sort());
 for(const [i,c] of chapters.entries()){assert.equal(chapterFromHash('#'+c.id),i);assert.ok(['map','bus','tracker','nfc'].includes(chapterScene(i)));assert.ok(c.note);}
 assert.equal(chapterFromHash('#learning'),0);assert.equal(chapterFromHash('#invalid'),0);
});
test('System-map workspace links retain valid existing role routes',()=>{
 for(const role of roleTours){const url=new URL(prototypeURL(role.id));assert.equal(url.origin,new URL(prototypeBase).origin);const [id,page]=url.hash.slice(1).split('/');assert.equal(id,role.id);assert.ok(page==='login'||roles[id].pages.includes(page));}
 assert.equal(prototypeURL('https://evil.example'),prototypeBase);
});
test('Presentation links preserve host and GitHub Pages repository prefix',()=>{
 for(const path of ['showcase/','showcase','showcase/index.html'])assert.equal(prototypeBaseFor('https://tradex-innovations.github.io/Sussex-LMS/'+path+'?mode=explore#privacy'),'https://tradex-innovations.github.io/Sussex-LMS/');
 assert.equal(prototypeBaseFor('http://127.0.0.1:4183/showcase/#pilot'),'http://127.0.0.1:4183/');
});
test('Parent visibility honours both weekday windows, closed trips and boundaries',()=>{
 for(const time of ['06:00','07:15','08:30','13:00','14:30','16:00'])assert.equal(parentLocationVisible({...initialDemo,time}),true,time);
 for(const time of ['05:59','08:31','12:59','16:01','18:00'])assert.equal(parentLocationVisible({...initialDemo,time}),false,time);
 assert.equal(parentLocationVisible({...initialDemo,weekday:false}),false);assert.equal(parentLocationVisible({...initialDemo,tripClosed:true}),false);
 assert.equal(locationVisible({...initialDemo,audience:'management',time:'18:00',weekday:false,tripClosed:true}),true);
});
test('Signal loss and recovery stay independent of parent visibility and the school-day windows',()=>{
 let state=reduce(initialDemo,{type:'signal'});assert.equal(state.signal,false);assert.equal(locationVisible(state),true);
 state=reduce(state,{type:'time',value:'18:00'});assert.equal(locationVisible(state),false);
 state=reduce(state,{type:'signal'});assert.equal(state.signal,true);assert.equal(locationVisible(state),false);
 state=reduce(state,{type:'audience',value:'management'});assert.equal(locationVisible(state),true);
});
test('Late, breakdown, other and resolved updates remain available after GPS hours',()=>{
 let state=reduce(initialDemo,{type:'time',value:'18:00'});
 for(const value of Object.keys(alertLabels)){state=reduce(state,{type:'issue',value});assert.equal(state.issue,value);state=reduce(state,{type:'notify'});assert.equal(state.alert,value);assert.equal(locationVisible(state),false);}
});
test('NFC offline capture requires reconnect/sync and repeated taps do not duplicate boarding',()=>{
 let state=reduce(initialDemo,{type:'reader'});state=reduce(state,{type:'tap'});state=reduce(state,{type:'tap'});assert.equal(state.queued,true);assert.equal(state.boarding,'pending');
 state=reduce(state,{type:'sync'});assert.equal(state.boarding,'pending');state=reduce(state,{type:'reader'});state=reduce(state,{type:'sync'});assert.equal(state.boarding,'boarded');assert.equal(state.queued,false);
 state=reduce(state,{type:'tap'});assert.match(state.tapMessage,/Repeated tap ignored/);assert.equal(state.boarding,'boarded');
});
test('Missing taps need review, confirmed boarding is retained, and NFC does not close GPS visibility',()=>{
 const state=reduce(initialDemo,{type:'missed'});assert.equal(state.boarding,'review');assert.equal(state.tripClosed,false);assert.equal(state.signal,true);assert.equal(locationVisible(state),true);assert.equal('attendance' in state,false);
 const boarded=reduce(initialDemo,{type:'tap'});assert.equal(reduce(boarded,{type:'missed'}).boarding,'boarded');
});
test('Invalid choices leave state unchanged; progress is bounded and reset is isolated',()=>{
 for(const action of [{type:'branch',id:'foreign'},{type:'audience',value:'root'},{type:'time',value:'24:61'},{type:'issue',value:'all-schools'},{type:'operation',value:'academic'}])assert.equal(reduce(initialDemo,action),initialDemo);
 let state=initialDemo;for(let i=0;i<20;i++)state=reduce(state,{type:'advance'});assert.equal(state.journey,1);assert.deepEqual(reduce(state,{type:'reset'}),initialDemo);
 assert.equal(initialDemo.journey,.28);
});
