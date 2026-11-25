import test from 'node:test';
import assert from 'node:assert/strict';
import { branches, chapters, initialDemo, demoReducer as reduce, comparison, chapterFromHash, prototypeURL, prototypeBase, prototypeBaseFor, roleTours, focusedTours, tourDetails } from '../showcase/src/data.js';
import { roles } from '../dist/data.js';
import { assessmentResult } from '../dist/network-analytics.js';

test('Showcase keeps seven addressable chapters, the verified 20 branches and all current 13 roles',()=>{
 assert.equal(chapters.length,7);assert.equal(new Set(chapters.map(item=>item.id)).size,7);assert.equal(branches.length,20);assert.equal(new Set(branches.map(branch=>branch.id)).size,20);
 assert.deepEqual(roleTours.map(role=>role.id).sort(),Object.keys(roles).sort());assert.equal(focusedTours.length,4);
 for(const chapter of chapters)assert.equal(chapterFromHash('#'+chapter.id),chapters.indexOf(chapter));assert.equal(chapterFromHash('#invalid'),0);
});
test('Presentation route targets stay on the prototype and use valid role pages',()=>{
 for(const role of roleTours){const url=new URL(prototypeURL(role.id));assert.equal(url.origin,new URL(prototypeBase).origin);const [id,page]=url.hash.slice(1).split('/');assert.equal(id,role.id);assert.ok(page==='login'||roles[id].pages.includes(page));}
 for(const id of focusedTours)assert.equal(tourDetails[id].length,3);assert.equal(prototypeURL('https://evil.example'),prototypeBase);
});
test('Presentation links preserve the host and GitHub Pages repository prefix',()=>{
 for(const path of ['showcase/','showcase','showcase/index.html'])assert.equal(prototypeBaseFor('https://tradex-innovations.github.io/Sussex-LMS/'+path+'?mode=explore#learning'),'https://tradex-innovations.github.io/Sussex-LMS/');
 assert.equal(prototypeBaseFor('http://127.0.0.1:4183/showcase/#roles'),'http://127.0.0.1:4183/');
 assert.equal(prototypeBaseFor('https://campusway-school-demo.manusara.chatgpt.site/showcase/#network'),'https://campusway-school-demo.manusara.chatgpt.site/');
});
test('NFC offline capture requires sync and repeat taps do not duplicate boarding',()=>{
 let state=reduce(initialDemo,{type:'reader'});state=reduce(state,{type:'tap'});assert.equal(state.queued,true);assert.equal(state.boarding,'pending');
 state=reduce(state,{type:'sync'});assert.equal(state.boarding,'pending');state=reduce(state,{type:'reader'});state=reduce(state,{type:'sync'});assert.equal(state.boarding,'boarded');assert.equal(state.queued,false);
 state=reduce(state,{type:'tap'});assert.match(state.tapMessage,/Repeated tap ignored/);assert.equal(state.boarding,'boarded');
});
test('A missing scan creates review without marking classroom absence or learning completion',()=>{
 const state=reduce(initialDemo,{type:'missed'});assert.equal(state.boarding,'review');assert.equal(state.attendance,'');assert.equal(state.completed,false);assert.equal(state.published,false);
});
test('Subject publication gates completion and attendance stays a distinct class-teacher example',()=>{
 let state=reduce(initialDemo,{type:'complete'});assert.equal(state.completed,false);state=reduce(state,{type:'publish'});state=reduce(state,{type:'complete'});assert.equal(state.completed,true);
 state=reduce(state,{type:'attendance',value:'late'});assert.equal(state.attendance,'late');assert.equal(state.boarding,'pending');assert.equal(reduce(state,{type:'attendance',value:'bogus'}),state);
});
test('Presentation keeps teaching classes, selected subjects, homework and common notices distinct',()=>{
 let state=reduce(initialDemo,{type:'teaching-class',value:'8B'});state=reduce(state,{type:'publish'});state=reduce(state,{type:'give-homework'});assert.equal(state.classWork['8B'].notes,true);assert.equal(state.published,false);assert.equal(state.homeworkPublished,false);
 state=reduce(state,{type:'teaching-class',value:'8A'});state=reduce(state,{type:'give-homework'});state=reduce(state,{type:'homework-done'});assert.equal(state.homeworkDone,true);assert.equal(state.completed,false);assert.equal(state.attendance,'');
 state=reduce(state,{type:'student-subject'});assert.equal(reduce(state,{type:'homework-done'}).homeworkDone,true);state=reduce(state,{type:'class-notice'});assert.equal(state.noticePublished,true);assert.equal(state.subjectEnabled,false);assert.deepEqual(reduce(state,{type:'reset'}),initialDemo);
});
test('Reservation example preserves ordered confirmation and collection with separate item types and no payment',()=>{
 let state={...initialDemo};for(const stage of ['requested','confirmed','ready','collected']){state=reduce(state,{type:'reserve'});assert.equal(state.reservation,stage);}
 assert.equal(reduce(state,{type:'reserve'}).reservation,'collected');state=reduce(state,{type:'supply',value:'uniforms'});assert.equal(state.reservation,'none');state=reduce(state,{type:'size',value:'14'});assert.equal(state.size,'14');state=reduce(state,{type:'reserve'});assert.equal(reduce(state,{type:'size',value:'6'}).size,'14');
 assert.ok(!Object.keys(state).some(key=>/payment|price|paid|purchase/i.test(key)));
});
test('Academic comparison exactly reuses the existing illustrative LMS marks',()=>{
 const rows=comparison(initialDemo);assert.equal(rows.length,3);for(const row of rows)assert.equal(row.mean,assessmentResult(row.branch,{subject:'mathematics',grade:8,term:3}).mean);
 assert.equal(comparison({...initialDemo,compareAll:true}).length,20);assert.ok(comparison({...initialDemo,subject:'science'}).every(row=>Number.isFinite(row.mean)));
});
test('Invalid school/role choices do not change the example; reset is isolated and deterministic',()=>{
 assert.equal(reduce(initialDemo,{type:'branch',id:'foreign'}),initialDemo);assert.equal(reduce(initialDemo,{type:'role',id:'root'}),initialDemo);let state=reduce(initialDemo,{type:'role',id:'driver'});state=reduce(state,{type:'tour-step',value:10});assert.equal(state.tourStep,2);assert.deepEqual(reduce(state,{type:'reset'}),initialDemo);
 let progress={...initialDemo};for(let i=0;i<20;i++)progress=reduce(progress,{type:'advance'});assert.equal(progress.journey,1);
});
