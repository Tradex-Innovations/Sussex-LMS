import test from "node:test";
import assert from "node:assert/strict";
import { freshState, roles, saveState, loadState } from "../dist/data.js";
import { contextFor, visibleBuses, can } from "../dist/access.js";
import { assignDriver, saveBusAssignment } from "../dist/transport-records.js";
import { coordinatorScope, coordinatorBuses, coordinatorFleet, coordinatorFilters, coordinatorDrivers, coordinatorStudents, coordinatorRoutes, coordinatorTasks, coordinatorOverview, saveCoordinatorTask, saveCoordinatorAllocation, generateCoordinatorReport, visibleCoordinatorReports } from "../dist/coordinator-data.js";
import { schoolFollowups, saveSchoolFollowup } from "../dist/vice-data.js";
import { coordinatorReportHTML, transportCoordinatorPage } from "../dist/transport-coordinator.js";
import { reportCSV } from "../dist/chairman-data.js";

const setup=()=>{const state=freshState(),context=contextFor(state,"transport","transport_c");return{state,context};};
const busInput=(state,id="01")=>{const bus=state.buses.find(bus=>bus.id===id);return{id,name:bus.name,driver:bus.driverId,stops:[...bus.stops],students:state.students.filter(student=>student.branch===bus.branch&&student.bus===id).map(student=>student.id)};};
const issue={busId:"01",title:"Review pickup delay",due:"2026-11-23",status:"open",note:"PRIVATE_TRANSPORT_NOTE"};

test("Coordinator scope follows the real active school appointment and excludes synthetic vehicles",()=>{
 const {state,context}=setup();assert.equal(roles.transport.start,"overview");assert.deepEqual(roles.transport.pages,["overview","transport","boarding"]);
 assert.equal(coordinatorScope(state,{...context,branch:"lakeside"}).branch.id,"colombo");assert.equal(coordinatorScope(state,{...context,grant:{...context.grant,branch:"lakeside"}}),null);
 assert.equal(coordinatorBuses(state,context).length,6);assert.equal(coordinatorFleet(state,context).length,6);assert.ok(coordinatorFleet(state,context).every(bus=>bus.operational&&bus.branch==="colombo"));
 for(const role of ["principal","vice_principal","admin","teacher","driver","parent"])assert.equal(coordinatorScope(state,contextFor(state,role)),null);
 for(const permission of ["roles.manage","students.edit","courses.assign","materials.publish","attendance.mark","library.manage","trip.manage"])assert.equal(can(context,permission),false);
 state.accounts.find(person=>person.id==="transport_c").grants=[];assert.equal(coordinatorScope(state,context),null);assert.throws(()=>saveCoordinatorTask(state,context,issue),/appointment/);
});

test("Fleet and people filters never include another school's buses, students or drivers",()=>{
 const {state,context}=setup();assert.ok(coordinatorStudents(state,context).every(row=>row.student.branch==="colombo"));assert.ok(coordinatorDrivers(state,context).every(row=>row.person.grants.some(grant=>grant.role==="driver"&&grant.branch==="colombo")));
 assert.equal(coordinatorRoutes(state,context,{status:"delayed"}).length,1);assert.equal(coordinatorStudents(state,context,{query:"SCN-1001"}).length,1);
 assert.ok(coordinatorStudents(state,context,{busFilter:"01"}).every(row=>row.student.bus==="01"));assert.equal(coordinatorFilters(state,context,{busId:"07",busFilter:"07"}).busFilter,"all");
 const data=coordinatorOverview(state,context);assert.equal(data.route+data.school+data.delayed,6);assert.equal(data.students.length,7);
});

test("Bus writes are validated atomically for school, students, driver and school destination",()=>{
 const {state,context}=setup(),input=busInput(state),before=JSON.stringify(state);
 for(const invalid of [{id:"07"},{id:"demo-galle-1"},{driver:"driver_07"},{students:["meera"]},{students:["amaya","amaya"]},{name:""},{stops:input.stops.slice(0,-1)},{stops:[...input.stops.slice(0,-1),"Other school"]}]){assert.throws(()=>saveBusAssignment(state,context,{...input,...invalid}));assert.equal(JSON.stringify(state),before);}
 for(const role of ["admin","teacher","driver"])assert.throws(()=>saveBusAssignment(state,contextFor(state,role),input),/operational bus/);
 const saved=saveBusAssignment(state,context,{...input,name:"Updated school pickup",stops:["Updated pickup",...input.stops.slice(1)]});assert.equal(saved.name,"Updated school pickup");assert.equal(saved.stops[0],"Updated pickup");
});

test("Driver movement preserves an unassigned appointment and synchronises Driver portal access",()=>{
 const {state,context}=setup(),input=busInput(state),foreign=structuredClone(state.buses.filter(bus=>bus.branch==="lakeside"));
 saveBusAssignment(state,context,{...input,driver:"driver_02"});assert.equal(state.buses.find(bus=>bus.id==="02").driverId,"");assert.equal(state.buses.find(bus=>bus.id==="01").driverId,"driver_02");
 assert.deepEqual(visibleBuses(state,contextFor(state,"driver","driver_02")).map(bus=>bus.id),["01"]);assert.deepEqual(visibleBuses(state,contextFor(state,"driver","driver_01")),[]);
 assert.equal(coordinatorDrivers(state,context,{driverStatus:"unassigned"}).some(row=>row.person.id==="driver_01"),true);assert.deepEqual(state.buses.filter(bus=>bus.branch==="lakeside"),foreign);
 saveBusAssignment(state,context,{...busInput(state),driver:""});assert.equal(state.buses.find(bus=>bus.id==="01").driver,"Unassigned");assert.deepEqual(visibleBuses(state,contextFor(state,"driver","driver_02")),[]);
 saveCoordinatorAllocation(state,context,{kind:"driver",person:"driver_01",busId:"01"});assert.deepEqual(visibleBuses(state,contextFor(state,"driver","driver_01")).map(bus=>bus.id),["01"]);
});

test("A school coordinator cannot move an eligible multi-school driver away from another school",()=>{
 const {state,context}=setup();state.accounts.find(person=>person.id==="driver_07").grants.push({role:"driver",branch:"colombo",bus:""});const before=JSON.stringify(state);
 assert.throws(()=>saveBusAssignment(state,context,{...busInput(state),driver:"driver_07"}),/Chairman/);assert.equal(JSON.stringify(state),before);
});

test("Student allocation moves only the transport assignment, preserving admissions and learning records",()=>{
 const {state,context}=setup(),student=structuredClone(state.students.find(student=>student.id==="amaya")),assignments=structuredClone(state.assignments),completed=structuredClone(state.completed);
 saveCoordinatorAllocation(state,context,{kind:"student",person:"amaya",busId:"02"});const moved=state.students.find(student=>student.id==="amaya");assert.equal(moved.bus,"02");assert.deepEqual({...moved,bus:student.bus},student);assert.deepEqual(state.assignments,assignments);assert.deepEqual(state.completed,completed);
 assert.throws(()=>saveCoordinatorAllocation(state,context,{kind:"student",person:"meera",busId:"01"}),/appointed school/);assert.throws(()=>saveCoordinatorAllocation(state,context,{kind:"student",person:"amaya",busId:"07"}),/operational bus/);
 const input=busInput(state,"02");saveBusAssignment(state,context,{...input,students:input.students.filter(id=>id!=="amaya")});assert.equal(state.students.find(student=>student.id==="amaya").bus,undefined);
});

test("Coordinator issues and Vice Principal follow-ups share status and history without dispatching trips",()=>{
 const {state,context}=setup(),scope=coordinatorScope(state,context),saved=saveCoordinatorTask(state,context,issue),statuses=state.buses.map(bus=>bus.status),vice=contextFor(state,"vice_principal","vice_c");
 assert.ok(schoolFollowups(state,scope.branch).some(task=>task.id===saved.id));assert.ok(coordinatorTasks(state,context).some(task=>task.id==="followup-colombo-0"));
 saveSchoolFollowup(state,vice,{...saved,status:"in_progress",note:"Vice Principal review recorded"});assert.equal(coordinatorTasks(state,context).find(task=>task.id===saved.id).notes.length,2);
 saveCoordinatorTask(state,context,{id:saved.id,status:"resolved",note:"Pickup sequence confirmed",title:"Ignored title",due:"2026-11-27",assignee:"vice_c"});const current=schoolFollowups(state,scope.branch).find(task=>task.id===saved.id);assert.equal(current.status,"resolved");assert.equal(current.title,issue.title);assert.equal(current.due,issue.due);assert.equal(current.assignee,"transport_c");assert.equal(current.notes.length,3);assert.deepEqual(state.buses.map(bus=>bus.status),statuses);
});

test("Issue access rejects other coordinators, other schools and non-transport follow-ups",()=>{
 const {state,context}=setup(),saved=saveCoordinatorTask(state,context,issue);state.accounts.push({id:"other_transport",name:"Other School Coordinator",grants:[{role:"transport",branch:"colombo"}]});
 for(const ctx of [contextFor(state,"transport","transport_l"),contextFor(state,"transport","other_transport")]){assert.ok(!coordinatorTasks(state,ctx).some(task=>task.id===saved.id));assert.throws(()=>saveCoordinatorTask(state,ctx,{id:saved.id,status:"resolved",note:"Not mine"}),/currently assigned/);}
 assert.throws(()=>saveCoordinatorTask(state,context,{id:"followup-colombo-1",status:"resolved",note:"Attendance"}),/currently assigned/);
 for(const invalid of [{busId:"07"},{due:"2026-11-31"},{status:"approved"},{note:""}])assert.throws(()=>saveCoordinatorTask(state,context,{...issue,...invalid}));
});

test("Five report types capture scoped operational records and exclude free-text notes and synthetic metrics",()=>{
 const {state,context}=setup();saveCoordinatorTask(state,context,issue);
 for(const type of ["brief","fleet","routes","students","tasks"]){const report=generateCoordinatorReport(state,context,{reportType:type},{progress:()=>0.5,elapsed:0,paused:false});assert.equal(report.owner.key,"transport:colombo:transport_c");assert.deepEqual(report.criteria.scope,["colombo"]);
 for(const output of [JSON.stringify(report),reportCSV(report),coordinatorReportHTML(report)])assert.doesNotMatch(output,/PRIVATE_TRANSPORT_NOTE|Malabe|Students on board|Academic assessment|Attendance period|undefined/);
 assert.match(reportCSV(report),/SIMULATED GPS/);assert.match(coordinatorReportHTML(report),/School Transport Coordination/);
 if(type==="fleet"){assert.equal(report.customRows.length,6);assert.ok(report.customRows.every(row=>Number(row.lat)>5&&Number(row.lon)>79));}
 if(type==="students")assert.equal(report.customRows.length,7);}
 assert.throws(()=>generateCoordinatorReport(state,context,{busFilter:"07"}),/operational fleet/);
});

test("Report filters have explicit type semantics and exact scoped row totals",()=>{
 const {state,context}=setup();saveCoordinatorTask(state,context,issue);
 const routes=generateCoordinatorReport(state,context,{reportType:"routes",busFilter:"01"});assert.equal(routes.customRows.length,state.buses[0].stops.length);assert.equal(routes.summary.buses,1);
 const students=generateCoordinatorReport(state,context,{reportType:"students",query:"SCN-1001",status:"delayed"});assert.equal(students.customRows.length,1);assert.equal(students.criteria.status,"all");assert.equal(students.criteria.studentIds[0],"amaya");
 const tasks=generateCoordinatorReport(state,context,{reportType:"tasks",taskStatus:"resolved"});assert.equal(tasks.customRows.length,0);
 const brief=generateCoordinatorReport(state,context,{reportType:"brief",query:"no match"});assert.equal(brief.criteria.query,"");assert.equal(brief.customRows.length,6);
});

test("Saved reports isolate accounts and schools and recheck captured bus/student/task access",()=>{
 const {state,context}=setup(),saved=saveCoordinatorTask(state,context,issue),report=generateCoordinatorReport(state,context,{reportType:"tasks"});state.coordinatorReports=[report];assert.equal(visibleCoordinatorReports(state,context).length,1);
 assert.equal(visibleCoordinatorReports(state,contextFor(state,"transport","transport_l")).length,0);assert.equal(visibleCoordinatorReports(state,contextFor(state,"vice_principal","vice_c")).length,0);
 state.accounts.push({id:"other_transport",name:"Other Coordinator",grants:[{role:"transport",branch:"colombo"}]});assert.equal(visibleCoordinatorReports(state,contextFor(state,"transport","other_transport")).length,0);
 const original=JSON.stringify(report);saveCoordinatorTask(state,context,{id:saved.id,status:"resolved",note:"Later resolution"});assert.equal(JSON.stringify(report),original);
 const item=state.viceFollowups.find(task=>task.id===saved.id);item.assignee="other_transport";assert.equal(visibleCoordinatorReports(state,context).length,0);
 state.coordinatorReports=[generateCoordinatorReport(state,context,{reportType:"fleet"})];state.buses[0].branch="lakeside";assert.equal(visibleCoordinatorReports(state,context).length,0);
});

test("Coordinator state persists and CSV/HTML output sanitises stored text",()=>{
 const {state,context}=setup();saveCoordinatorTask(state,context,issue);state.buses[0].name='=HYPERLINK("demo")';let report=generateCoordinatorReport(state,context);assert.match(reportCSV(report),/'=HYPERLINK/);state.buses[0].name='<script>alert("demo")</script>';report=generateCoordinatorReport(state,context);assert.doesNotMatch(coordinatorReportHTML(report),/<script>/);assert.match(coordinatorReportHTML(report),/&lt;script&gt;/);
 state.coordinatorReports=[report];const previous=globalThis.localStorage,storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};try{assert.equal(saveState(state),true);const restored=loadState();assert.deepEqual(restored.coordinatorReports,state.coordinatorReports);assert.deepEqual(restored.viceFollowups,state.viceFollowups);}finally{globalThis.localStorage=previous;}
});

test("A newly appointed empty school never borrows synthetic network buses or other schools' people",()=>{
 const {state}=setup(),branch=state.branches.find(branch=>!["colombo","lakeside"].includes(branch.id));state.accounts.push({id:"empty_transport",name:"New Coordinator",grants:[{role:"transport",branch:branch.id}]});const context=contextFor(state,"transport","empty_transport");
 assert.equal(coordinatorFleet(state,context).length,0);assert.equal(coordinatorBuses(state,context).length,0);assert.equal(coordinatorStudents(state,context).length,0);for(const view of ["fleet","routes","assignments","issues","reports"]){const html=transportCoordinatorPage({state,context,transportCoordinator:{...coordinatorFilters(state,context),view},paused:true,progress:()=>0,networkElapsed:0});assert.match(html,/TRANSPORT COORDINATOR/);assert.doesNotMatch(html,/Nugegoda Loop|Meera Fernando|Kasun Dias/);}
 assert.equal(generateCoordinatorReport(state,context,{reportType:"fleet"}).customRows.length,0);
});

test("Authorised role appointment can provision a new driver while bus management requires an existing appointment",()=>{
 const {state,context}=setup();state.accounts.push({id:"new_driver",name:"New Driver",grants:[]});
 assert.throws(()=>saveBusAssignment(state,context,{...busInput(state),driver:"new_driver"}),/appointed/);
 assert.throws(()=>assignDriver(state,"01","new_driver",context),/appointed/);
 assignDriver(state,"01","new_driver",contextFor(state,"principal","principal_c"));assert.deepEqual(state.accounts.find(person=>person.id==="new_driver").grants,[{role:"driver",branch:"colombo",bus:"01"}]);
 assert.deepEqual(visibleBuses(state,contextFor(state,"driver","new_driver")).map(bus=>bus.id),["01"]);
 assert.equal(coordinatorDrivers(state,context,{driverStatus:"unassigned"}).some(row=>row.person.id==="driver_01"),true);
});
