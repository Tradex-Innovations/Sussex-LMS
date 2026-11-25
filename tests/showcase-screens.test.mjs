import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { screenshots, chapterScreens, roleScreenshot, screenshotSource } from '../showcase/src/screens.js';
import { roleTours, prototypeBase } from '../showcase/src/data.js';
import { roles } from '../dist/data.js';

test('Every screenshot is an actual captured PNG with matching dimensions and route metadata',()=>{
 const provenance=JSON.parse(fs.readFileSync(new URL('../showcase/public/assets/screens/captures.json',import.meta.url)));
 assert.equal(Object.keys(screenshots).length,38);assert.equal(provenance.captures.length,38);assert.match(provenance.sourceCommit,/^[a-f0-9]{40}$/);
 for(const [id,shot]of Object.entries(screenshots)){
  const file=fs.readFileSync(new URL('../showcase/public/assets/screens/'+shot.file,import.meta.url));assert.deepEqual([...file.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  const record=provenance.captures.find(item=>item.id===id);assert.ok(record,id);assert.equal(record.route,shot.route);assert.equal(file.readUInt32BE(16),record.width);assert.equal(file.readUInt32BE(20),record.height);
  const [role,page]=shot.route.split('/');assert.ok(roles[role].pages.includes(page === "subjects" ? "courses" : page));assert.equal(screenshotSource(id),'./assets/screens/'+shot.file);
 }
});
test('Each story chapter and all thirteen roles have valid screenshot coverage',()=>{
 assert.equal(chapterScreens.length,6);
 for(const list of chapterScreens){assert.ok(list.length);for(const [id,label]of list){assert.ok(screenshots[id]);assert.ok(label.length);}}
 for(const role of roleTours)assert.ok(screenshots[roleScreenshot(role.id)],role.id);
 for(const role of ['chairman','principal','parent','driver'])for(let step=0;step<3;step++)assert.ok(screenshots[roleScreenshot(role,step)]);
 assert.equal(roleScreenshot('uniform_store'),'uniform_store');assert.equal(roleScreenshot('parent',1),'parent-courses');assert.equal(roleScreenshot('driver',2),'driver-issues');
 for(const shot of Object.values(screenshots))assert.equal(new URL(prototypeBase+'#'+shot.route).origin,new URL(prototypeBase).origin);
});
