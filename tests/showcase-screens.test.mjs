import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { blackPixelFraction } from './helpers/png-quality.mjs';
import { screenshots, chapterScreens, screenshotSource } from '../showcase/src/screens.js';
import { chapters, prototypeBase } from '../showcase/src/data.js';
import { roles } from '../dist/data.js';

test('Every screenshot is an actual captured PNG with matching dimensions and route metadata',()=>{
 const provenance=JSON.parse(fs.readFileSync(new URL('../showcase/public/assets/screens/captures.json',import.meta.url)));
 assert.equal(Object.keys(screenshots).length,18);assert.equal(provenance.captures.length,18);assert.match(provenance.sourceCommit,/^[a-f0-9]{40}$/);
 for(const [id,shot]of Object.entries(screenshots)){
  const file=fs.readFileSync(new URL('../showcase/public/assets/screens/'+shot.file,import.meta.url));assert.deepEqual([...file.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  const record=provenance.captures.find(item=>item.id===id);assert.ok(record,id);assert.equal(record.route,shot.route);assert.equal(file.readUInt32BE(16),record.width);assert.equal(file.readUInt32BE(20),record.height);assert.equal(shot.width,record.width);assert.equal(shot.height,record.height);
  if(shot.mobile)assert.ok(record.height/record.width>1.7,`${id} must be a portrait phone capture, not a scaled landscape screenshot`);
  const [role,page]=shot.route.split('/');assert.ok(roles[role].pages.includes(page === "subjects" ? "courses" : page));assert.equal(screenshotSource(id),'./assets/screens/'+shot.file);
 }
});
test('Portal screenshot captures contain no large black failure regions',()=>{
 for(const [id,shot]of Object.entries(screenshots)){
  const file=fs.readFileSync(new URL('../showcase/public/assets/screens/'+shot.file,import.meta.url));
  assert.ok(blackPixelFraction(file)<.25,`${id} contains a large black capture region; recapture the actual portal`);
 }
});
test('Each transport chapter has real screenshots and no unrelated story workspaces',()=>{
 assert.equal(chapterScreens.length,chapters.length);
 const used=new Set();
 for(const list of chapterScreens){assert.ok(list.length);for(const [id,label]of list){assert.ok(screenshots[id]);assert.ok(label.length);used.add(id);}}
 assert.deepEqual([...used].sort(),Object.keys(screenshots).sort());
 for(const shot of Object.values(screenshots)){
  assert.equal(new URL(prototypeBase+'#'+shot.route).origin,new URL(prototypeBase).origin);
  assert.doesNotMatch(shot.route,/academic|attendance|staffing|fees|subjects|homework|events|library|uniforms|communications/);
 }
});
