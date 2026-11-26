import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, roles, saveState, loadState } from '../dist/data.js';
import { contextFor, visibleBuses } from '../dist/access.js';
import { migrateGpsTransport } from '../dist/gps-seed.js';
import { gpsManagementRoles, trackingPolicy, saveTrackingPolicy, completeTrackingTrip } from '../dist/transport-privacy.js';
import { networkFleet, networkTelemetry } from '../dist/network-fleet.js';
import { authenticateParent, parentContext } from '../dist/parent-login.js';
import { saveBusAssignment, saveTrackerSignal } from '../dist/transport-records.js';
const policy=(time='18:00',date='2026-11-26')=>({pickupStart:'06:00',pickupEnd:'08:30',dropoffStart:'13:00',dropoffEnd:'16:00',mode:'demo',date,time});
const family=state=>parentContext(state,authenticateParent(state,'FAMILY-1001','1234'));
const edit=(state,bus=state.buses[0])=>({id:bus.id,name:bus.name,trackerId:bus.trackerId,stops:bus.stops,students:state.students.filter(s=>s.bus===bus.id&&s.branch===bus.branch).map(s=>s.id)});
test('Twelve current roles have no active Driver appointment or bus staff binding',()=>{
 const state=freshState();assert.equal(Object.keys(roles).length,12);assert.equal(roles.driver,undefined);assert.equal(contextFor(state,'driver','driver_01'),null);
 assert.ok(state.accounts.every(a=>a.grants.every(g=>g.role!=='driver')));assert.ok(state.buses.every(b=>b.trackerId&&!('driver' in b)&&!('driverId' in b)));
});
test('All five management roles retain actual scoped positions after hours, at weekends and after Parent completion',()=>{
 const state=freshState(),transport=contextFor(state,'transport','transport_c');
 saveTrackingPolicy(state,transport,policy('13:30'));completeTrackingTrip(state,transport,'01');assert.equal(trackingPolicy(state,state.buses[0],undefined,family(state)).visible,false);
 for(const date of ['2026-11-26','2026-11-28']){saveTrackingPolicy(state,transport,policy('23:59',date));for(const role of gpsManagementRoles){const ctx=contextFor(state,role),fleet=networkFleet(state,state.branches.filter(b=>ctx.branch==='all'||b.id===ctx.branch),ctx);assert.ok(fleet.length);assert.ok(fleet.every(bus=>bus.trackingVisible&&networkTelemetry(bus).position),role);}}
});
test('Parent visibility follows coordinator windows and current selected-child allocation; management scope never expands',()=>{
 const state=freshState(),transport=contextFor(state,'transport','transport_c'),parent=family(state),bus=state.buses[0];
 for(const [time,expected] of [['05:59',false],['06:00',true],['08:30',false],['13:00',true],['16:00',false],['23:00',false]]){saveTrackingPolicy(state,transport,policy(time));assert.equal(trackingPolicy(state,bus,undefined,parent).visible,expected,time);}
 saveTrackingPolicy(state,transport,policy('07:15'));assert.equal(trackingPolicy(state,state.buses[1],undefined,parent).visible,false);assert.equal(trackingPolicy(state,state.buses[6],undefined,transport).visible,false);
 const changed={...policy('09:15'),pickupStart:'09:00',pickupEnd:'10:00'};saveTrackingPolicy(state,transport,changed);assert.equal(trackingPolicy(state,bus,undefined,parent).visible,true);
 for(const role of ['section_head','coordinator','class_teacher','teacher']){const ctx=contextFor(state,role);assert.equal(trackingPolicy(state,bus,undefined,ctx).visible,false);assert.deepEqual(visibleBuses(state,ctx),[]);}
});
test('Removed appointments, missing trackers and wrong-school management do not fall back to Parent visibility',()=>{
 const state=freshState(),ctx=contextFor(state,'transport','transport_c');state.accounts.find(a=>a.id==='transport_c').grants=[];assert.equal(trackingPolicy(state,state.buses[0],undefined,ctx).visible,false);
 state.buses[0].trackerId='';assert.equal(trackingPolicy(state,state.buses[0],undefined,contextFor(state,'chairman')).visible,false);
});
test('Legacy Driver data and Driver report snapshots are archived once; mixed-role and unrelated data survives reload',()=>{
 const state=freshState(),studentSnapshot=structuredClone(state.students);delete state.gpsTransportVersion;
 state.accounts.push({id:'retired',name:'Former Driver',grants:[{role:'driver',branch:'colombo',bus:'01'}]});state.accounts.find(a=>a.id==='dilini').grants.push({role:'driver',branch:'colombo',bus:'02'});
 state.driverRuns=[{id:'old-run'}];state.driverIncidents=[{id:'old-issue'}];state.coordinatorReports=[{id:'old-report',customColumns:[['driver','Driver']],customRows:[{driver:'Former Driver'}]},{id:'keep-report',customColumns:[['bus','Bus']]}];
 state.executiveReports=[{id:'old-executive',type:'transport',buses:[{driver:'Former Driver'}]}];
 state.buses[0].driverId='retired';state.buses[0].driver='Former Driver';state.buses[0].name='Preserved route';delete state.buses[0].trackerId;
 migrateGpsTransport(state);assert.equal(state.accounts.some(a=>a.id==='retired'),false);assert.ok(state.accounts.find(a=>a.id==='dilini').grants.length);assert.equal(state.retiredTransport.runs[0].id,'old-run');assert.equal(state.retiredTransport.incidents[0].id,'old-issue');assert.equal(state.retiredTransport.reports.length,2);assert.deepEqual(state.executiveReports,[]);assert.equal(state.coordinatorReports[0].id,'keep-report');assert.deepEqual(state.students,studentSnapshot);assert.equal(state.buses[0].name,'Preserved route');
 const archive=structuredClone(state.retiredTransport);state.buses[0].trackerId='';migrateGpsTransport(state);assert.equal(state.buses[0].trackerId,'');assert.deepEqual(state.retiredTransport,archive);
 const previous=globalThis.localStorage;let json;globalThis.localStorage={getItem:()=>json,setItem:(_,value)=>{json=value;}};try{saveState(state);const loaded=loadState();assert.deepEqual(loaded.retiredTransport,archive);assert.equal(loaded.buses[0].trackerId,'');assert.equal(contextFor(loaded,'driver','retired'),null);}finally{globalThis.localStorage=previous;}
});
test('Tracker writes reject invalid/duplicate/foreign input atomically and Administrator stays read-only',()=>{
 const state=freshState(),ctx=contextFor(state,'transport','transport_c'),before=JSON.stringify(state);
 for(const extra of [{trackerId:'X'},{trackerId:state.buses[6].trackerId},{trackerStatus:'invalid'},{driver:'retired'}]){assert.throws(()=>saveBusAssignment(state,ctx,{...edit(state),...extra}));assert.equal(JSON.stringify(state),before);}
 assert.throws(()=>saveBusAssignment(state,contextFor(state,'admin','admin_c'),edit(state)));assert.throws(()=>saveTrackerSignal(state,contextFor(state,'admin','admin_c'),{id:'01',status:'offline'}));assert.equal(JSON.stringify(state),before);
});
