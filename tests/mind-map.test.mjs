import test from 'node:test';
import assert from 'node:assert/strict';
import { roles } from '../dist/data.js';
import { chairmanViews } from '../dist/chairman-data.js';
import { sectionViews } from '../dist/section-data.js';
import { gradeViews } from '../dist/grade-data.js';
import { classViews } from '../dist/class-data.js';
import { subjectViews } from '../dist/subject-data.js';
import { adminViews } from '../dist/admin-data.js';
import { coordinatorViews } from '../dist/coordinator-data.js';
import { storeViews } from '../dist/stores-data.js';
import { architectureLinks, architectureNodes, architectureSize, familyServiceLinks, mindMapRoles, parseMindMapHash, mindMapHash, roleMapLayout, fitMap, zoomMap } from '../showcase/src/mind-map-data.js';
const modules={chairman:chairmanViews,principal:chairmanViews,vice_principal:chairmanViews,section_head:sectionViews,coordinator:gradeViews,class_teacher:classViews,teacher:subjectViews,admin:adminViews,transport:coordinatorViews,librarian:storeViews,uniform_store:storeViews};
test('Architecture covers all twelve current roles, with reporting and family-service links distinguished',()=>{
 assert.deepEqual(Object.keys(mindMapRoles).sort(),Object.keys(roles).sort()); assert.equal(new Set(architectureNodes.map(n=>n.id)).size,12);
 for(const node of architectureNodes){assert.ok(mindMapRoles[node.id]);assert.ok(node.x>=0&&node.y>=0&&node.x+node.width<=architectureSize.width&&node.y+node.height<=architectureSize.height);}
 const parents=new Map();for(const edge of architectureLinks){assert.equal(edge.type,'reporting');assert.ok(mindMapRoles[edge.from]);assert.ok(mindMapRoles[edge.to]);assert.ok(!parents.has(edge.to));parents.set(edge.to,edge.from);}
 assert.equal(parents.get('principal'),'chairman');assert.equal(parents.has('driver'),false);assert.equal(parents.get('coordinator'),'section_head');assert.equal(parents.has('parent'),false);
 for(const role of Object.keys(roles).filter(id=>!['chairman','parent'].includes(id))){const seen=new Set();let id=role;while(id){assert.ok(!seen.has(id),'Reporting cycle: '+role);seen.add(id);id=parents.get(id);}assert.ok(seen.has('chairman'));}
 assert.ok(familyServiceLinks.length>0);for(const edge of familyServiceLinks){assert.equal(edge.type,'service');assert.equal(edge.to,'parent');}
});
test('Every role exposes a complete, scoped feature map and every existing navigation page is covered',()=>{
 for(const [id,role] of Object.entries(mindMapRoles)){
  assert.equal(role.label,roles[id].name);assert.ok(role.scope.length&&role.scopeDetail.length&&role.limits.length);assert.ok(role.features.length>=5&&role.features.length<=8);
  assert.equal(new Set(role.features.map(f=>f.id)).size,role.features.length);const covered=new Set();const overviewCovered=new Set();
  for(const feature of role.features){assert.ok(feature.views.length);assert.ok(feature.actions.length);assert.ok(feature.routes.length);for(const item of feature.routes){const[routeRole,page,module]=item.route.split('/');assert.equal(routeRole,id);const normalized=page==='subjects'?'courses':page;assert.ok(roles[id].pages.includes(normalized),item.route);covered.add(normalized);if(module){assert.ok(modules[id]?.some(view=>view.id===module),item.route);overviewCovered.add(module);}}}
  assert.deepEqual([...covered].sort(),[...roles[id].pages].sort(),id+' navigation coverage');
  if(modules[id])assert.deepEqual([...overviewCovered].sort(),modules[id].map(v=>v.id).sort(),id+' overview coverage');
 }
});
test('Direct links round-trip role and feature selection; unknown paths cannot become arbitrary prototype links',()=>{
 assert.equal(parseMindMapHash('#family'),null);assert.equal(parseMindMapHash('#mind-map-malicious'),null);assert.deepEqual(parseMindMapHash('#mind-map'),{role:null,feature:null});
 for(const role of Object.values(mindMapRoles)){assert.deepEqual(parseMindMapHash(mindMapHash(role.id)),{role:role.id,feature:null});for(const id of ['scope',...role.features.map(f=>f.id)])assert.deepEqual(parseMindMapHash(mindMapHash(role.id,id)),{role:role.id,feature:id});}
 assert.deepEqual(parseMindMapHash('#mind-map/unknown/fees'),{role:null,feature:null});assert.deepEqual(parseMindMapHash('#mind-map/parent/unknown'),{role:'parent',feature:null});assert.equal(mindMapHash('https://example.com'),'#mind-map');
});
test('Role maps remain inside their canvas; fit and cursor-anchored zoom work at desktop and mobile sizes',()=>{
 for(const role of Object.keys(roles)){const layout=roleMapLayout(role);for(const node of [layout.center,...layout.nodes]){assert.ok(node.x>=0&&node.y>=0);assert.ok(node.x+node.width<=layout.width&&node.y+node.height<=layout.height);}}
 for(const viewport of [{width:1360,height:600},{width:390,height:440},{width:320,height:300}]){const view=fitMap(architectureSize,viewport,20);assert.ok(view.scale>0);assert.ok(view.x>=0&&view.y>=0);assert.ok(view.x+architectureSize.width*view.scale<=viewport.width);assert.ok(view.y+architectureSize.height*view.scale<=viewport.height);const anchor={x:viewport.width/2,y:viewport.height/2},next=zoomMap(view,view.scale*1.2,anchor);assert.ok(Math.abs((anchor.x-view.x)/view.scale-(anchor.x-next.x)/next.scale)<.0001);assert.ok(Math.abs((anchor.y-view.y)/view.scale-(anchor.y-next.y)/next.scale)<.0001);}
 assert.equal(zoomMap({x:0,y:0,scale:1},100,{x:0,y:0}).scale,2.4);assert.equal(roleMapLayout('unknown'),null);
});
test('Sensitive distinctions are explained without expanding actual role permissions',()=>{
 const find=(role,id)=>mindMapRoles[role].features.find(f=>f.id===id);
 for(const id of ['chairman','principal']){assert.match(find(id,'fees').note,/Read-only/);assert.ok(!find(id,'fees').actions.some(text=>/Issue|Record.*payment|Send.*reminder/.test(text)));}
 assert.match(find('admin','fees').actions.join(' '),/Issue demo fee invoices/);assert.match(find('coordinator','academic').note,/teacher is retained/);
 assert.match(mindMapRoles.class_teacher.limits.join(' '),/Lecture publication requires/);assert.match(find('parent','transport').note,/position is hidden/);assert.match(find('parent','fees').note,/No real card/);
 for(const id of ['librarian','uniform_store'])assert.doesNotMatch(find(id,'reports').actions.join(' '),/HTML|Print/);
 assert.match(mindMapRoles.parent.scopeDetail,/valid linked children/);assert.doesNotMatch(JSON.stringify(mindMapRoles),/real payment processing|enter exam marks/);
});
