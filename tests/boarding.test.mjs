import assert from "node:assert/strict";
import test from "node:test";
import { freshState, loadState, saveState, roles } from "../dist/data.js";
import { contextFor } from "../dist/access.js";
import { authenticateParent, parentContext } from "../dist/parent-login.js";
import { boardingScope, boardingStudents, activeStudentCard, studentCards, visibleBoardingTrips, boardingRows, boardingSummary, tripReader, createBoardingTrip, issueBoardingCard, disableBoardingCard, simulateBoardingTap, setBoardingReader, syncBoardingReader, closeBoardingTrip, correctBoardingRecord, flagBoardingException, parentBoardingRows, boardingManifest } from "../dist/boarding-data.js";
import { boardingPage } from "../dist/boarding.js";
import { reportCSV } from "../dist/chairman-data.js";

const setup=()=>{const state=freshState(),transport=contextFor(state,"transport","transport_c"),admin=contextFor(state,"admin","admin_c"),driver=contextFor(state,"driver","driver_01");return{state,transport,admin,driver};};
const open=(state,ctx,busId="01",direction="to_school")=>createBoardingTrip(state,ctx,{busId,date:"2026-11-20",direction});
const tap=(state,ctx,trip,student="amaya")=>simulateBoardingTap(state,ctx,{tripId:trip.id,token:activeStudentCard(state,student).token});
const parent=(state,admission="SCN-1001")=>parentContext(state,authenticateParent(state,admission,"1234"));

test("NFC navigation and permissions follow the actual appointment and active role",()=>{
 const{state,transport,admin,driver}=setup();for(const role of ["chairman","principal","vice_principal","transport","driver","admin","parent"])assert.ok(roles[role].pages.includes("boarding"));
 for(const role of ["teacher","class_teacher","coordinator","section_head","librarian"])assert.equal(boardingScope(state,contextFor(state,role)),null);
 assert.equal(boardingScope(state,{...transport,branch:"lakeside"}).branches[0].id,"colombo");assert.equal(boardingScope(state,{...transport,grant:{...transport.grant,branch:"lakeside"}}),null);
 assert.deepEqual(boardingScope(state,driver).buses.map(bus=>bus.id),["01"]);assert.equal(boardingScope(state,admin).canOperate,false);assert.equal(boardingScope(state,transport).canCards,false);
 assert.equal(boardingScope(state,contextFor(state,"parent","parent")),null);assert.ok(boardingScope(state,parent(state)));
 state.accounts.find(person=>person.id==="transport_c").grants=[];assert.equal(boardingScope(state,transport),null);
});

test("NFC demo seed supplies cards/readers without changing existing transport or classroom records",()=>{
 const{state}=setup();assert.equal(state.nfcCards.length,4);assert.equal(new Set(state.nfcCards.map(card=>card.token)).size,4);assert.equal(state.nfcReaders.length,8);assert.deepEqual(state.nfcTrips,[]);assert.equal(state.classAttendance,undefined);
 assert.ok(state.nfcReaders.every(reader=>state.buses.some(bus=>bus.id===reader.busId&&bus.branch===reader.branch)&&reader.online&&reader.queue.length===0));
 assert.ok(state.nfcCards.every(card=>state.students.some(student=>student.id===card.studentId&&student.bus&&student.branch===card.branch)));
});

test("Card issuance is school-scoped, globally unique, and limited to transport students",()=>{
 const{state,admin,transport}=setup();state.students.find(student=>student.id==="lohith").bus="01";
 const card=issueBoardingCard(state,admin,{studentId:"lohith",token:"demo-lohith-001",reason:"Initial issue"});assert.equal(card.token,"DEMO-LOHITH-001");
 const before=JSON.stringify(state);for(const input of [{studentId:"meera",token:"OTHER-001",reason:"Wrong school"},{studentId:"sara",token:"SARA-001",reason:"No transport"},{studentId:"lohith",token:"SECOND-001",reason:"Second active"},{studentId:"lohith",token:card.token,reason:"Reused"}]){assert.throws(()=>issueBoardingCard(state,admin,input));assert.equal(JSON.stringify(state),before);}
 assert.throws(()=>issueBoardingCard(state,transport,{studentId:"amaya",token:"TEST-001",reason:"Not card manager"}),/scope/);
});

test("Replacement deactivates the old card, preserves past boarding and cannot reuse a retired code",()=>{
 const{state,transport,admin}=setup(),trip=open(state,transport),old=activeStudentCard(state,"amaya");tap(state,transport,trip);
 const original=structuredClone(state.nfcEvents[0]);disableBoardingCard(state,admin,{cardId:old.id,status:"lost",reason:"Lost at home"});assert.equal(old.status,"lost");
 const replacement=issueBoardingCard(state,admin,{studentId:"amaya",previousId:old.id,token:"REPLACEMENT-001",reason:"Replacement issue"});assert.equal(old.status,"replaced");assert.equal(old.replacedBy,replacement.id);assert.equal(activeStudentCard(state,"amaya").id,replacement.id);assert.ok(studentCards(state,"amaya").length===2);
 assert.equal(simulateBoardingTap(state,transport,{tripId:trip.id,token:old.token}).code,"inactive_card");assert.equal(boardingRows(state,transport,trip.id)[0].status,"boarded");assert.ok(state.nfcEvents.some(event=>event.id===original.id&&JSON.stringify(event)===JSON.stringify(original)));
 assert.throws(()=>issueBoardingCard(state,admin,{studentId:"amaya",previousId:replacement.id,token:old.token,reason:"Reused retired code"}),/already been used/);
});

test("Opening a trip snapshots actual allocated students and validates duplicate and concurrent trips",()=>{
 const{state,transport,driver,admin}=setup(),trip=open(state,driver);assert.deepEqual(trip.expected.map(row=>row.studentId),["amaya"]);
 state.students.find(student=>student.id==="lohith").bus="01";assert.equal(boardingRows(state,transport,trip.id).length,1);
 assert.throws(()=>open(state,transport),/already has a roster/);assert.throws(()=>open(state,transport,"01","from_school"),/Close this bus/);
 assert.throws(()=>open(state,driver,"02"),/assigned operational bus/);assert.throws(()=>open(state,admin),/assigned operational bus/);
 assert.throws(()=>createBoardingTrip(state,transport,{busId:"01",date:"2026-11-32",direction:"to_school"}),/demo trip/);
 closeBoardingTrip(state,transport,{tripId:trip.id});const afternoon=open(state,transport,"01","from_school");assert.equal(afternoon.expected.length,2);assert.deepEqual(visibleBoardingTrips(state,driver).map(trip=>trip.id),[afternoon.id]);
});

test("NFC taps create one boarding state, repeated taps stay boarding-only and classroom attendance is untouched",()=>{
 const{state,transport,driver}=setup(),trip=open(state,transport);state.classAttendance={sentinel:{status:"absent"}};const attendance=structuredClone(state.classAttendance),assignments=structuredClone(state.assignments),completed=structuredClone(state.completed);
 assert.equal(tap(state,driver,trip).code,"boarded");assert.equal(tap(state,driver,trip).code,"duplicate");assert.equal(boardingSummary(boardingRows(state,transport,trip.id)).boarded,1);assert.equal(state.nfcEvents.filter(event=>event.kind==="boarded").length,1);assert.equal(state.nfcEvents.filter(event=>event.kind==="duplicate").length,1);
 assert.deepEqual(state.classAttendance,attendance);assert.deepEqual(state.assignments,assignments);assert.deepEqual(state.completed,completed);
});

test("Unknown, wrong-school, wrong-bus and inactive scans are explicit exceptions without foreign identity leakage",()=>{
 const{state,transport,admin,driver}=setup(),trip=open(state,transport);
 for(const[token,code]of[["UNKNOWN-001","unknown_card"],[activeStudentCard(state,"meera").token,"wrong_school"],[activeStudentCard(state,"kavin").token,"wrong_bus"]]){const result=simulateBoardingTap(state,driver,{tripId:trip.id,token});assert.equal(result.code,code);assert.ok(!result.studentId);assert.doesNotMatch(result.message,/Meera|Kavin|SCN-1008|SCN-1002/);}
 disableBoardingCard(state,admin,{cardId:activeStudentCard(state,"amaya").id,status:"inactive",reason:"Card retired"});assert.equal(simulateBoardingTap(state,driver,{tripId:trip.id,token:studentCards(state,"amaya")[0].token}).code,"inactive_card");assert.equal(boardingSummary(boardingRows(state,transport,trip.id)).boarded,0);
});

test("Offline taps remain pending, then reconcile once after closure without double counting",()=>{
 const{state,transport,driver}=setup(),trip=open(state,transport),reader=tripReader(state,trip);setBoardingReader(state,driver,{readerId:reader.id,online:false});assert.equal(tap(state,driver,trip).code,"queued");assert.equal(tap(state,driver,trip).code,"queued");assert.equal(boardingRows(state,transport,trip.id)[0].status,"pending");const captured=reader.queue[0].capturedAt;
 closeBoardingTrip(state,transport,{tripId:trip.id});assert.equal(boardingRows(state,transport,trip.id)[0].status,"unverified");assert.throws(()=>correctBoardingRecord(state,transport,{tripId:trip.id,studentId:"amaya",status:"not_boarded",reason:"Not seen"}),/synchronise/);
 const results=syncBoardingReader(state,driver,{readerId:reader.id});assert.deepEqual(results.map(result=>result.code),["boarded","duplicate"]);assert.equal(reader.queue.length,0);assert.equal(boardingRows(state,transport,trip.id)[0].at,captured);assert.equal(boardingSummary(boardingRows(state,transport,trip.id)).boarded,1);const count=state.nfcEvents.length;assert.deepEqual(syncBoardingReader(state,driver,{readerId:reader.id}),[]);assert.equal(state.nfcEvents.length,count);
});

test("Offline reconciliation respects card validity at capture, including same-millisecond replacement",()=>{
 const{state,transport,admin}=setup(),trip=open(state,transport),reader=tripReader(state,trip),old=activeStudentCard(state,"amaya");setBoardingReader(state,transport,{readerId:reader.id,online:false});tap(state,transport,trip);
 disableBoardingCard(state,admin,{cardId:old.id,status:"lost",reason:"Lost after boarding"});issueBoardingCard(state,admin,{studentId:"amaya",previousId:old.id,token:"NEW-CARD-001",reason:"Replacement"});
 assert.equal(syncBoardingReader(state,transport,{readerId:reader.id})[0].code,"boarded");assert.equal(boardingRows(state,transport,trip.id)[0].status,"boarded");
});

test("Pickup closure produces needs-review, and only the coordinator can explicitly confirm non-boarding",()=>{
 const{state,transport,driver}=setup(),trip=open(state,transport);
 assert.throws(()=>correctBoardingRecord(state,transport,{tripId:trip.id,studentId:"amaya",status:"not_boarded",reason:"Early"}),/Close pickup/);assert.throws(()=>closeBoardingTrip(state,driver,{tripId:trip.id}),/access/);
 closeBoardingTrip(state,transport,{tripId:trip.id});assert.equal(boardingRows(state,transport,trip.id)[0].status,"unverified");assert.throws(()=>tap(state,driver,trip),/pickup window is closed/);assert.throws(()=>correctBoardingRecord(state,driver,{tripId:trip.id,studentId:"amaya",status:"boarded",reason:"Forbidden"}),/access/);
 assert.throws(()=>correctBoardingRecord(state,transport,{tripId:trip.id,studentId:"amaya",status:"not_boarded",reason:""}),/reason/);
 correctBoardingRecord(state,transport,{tripId:trip.id,studentId:"amaya",status:"not_boarded",reason:"Confirmed with driver and family"});assert.equal(boardingRows(state,transport,trip.id)[0].status,"not_boarded");assert.equal(state.classAttendance,undefined);
});

test("Driver concerns are recorded for review and staff corrections retain all original events",()=>{
 const{state,transport,driver}=setup(),trip=open(state,transport);tap(state,driver,trip);const original=structuredClone(state.nfcEvents[0]);flagBoardingException(state,driver,{tripId:trip.id,studentId:"amaya",reason:"Check incorrect tap"});assert.equal(boardingRows(state,transport,trip.id)[0].status,"boarded");
 correctBoardingRecord(state,transport,{tripId:trip.id,studentId:"amaya",status:"unverified",reason:"Staff checking record"});assert.equal(boardingRows(state,transport,trip.id)[0].status,"unverified");assert.ok(state.nfcEvents.some(event=>JSON.stringify(event)===JSON.stringify(original)));
 assert.throws(()=>flagBoardingException(state,driver,{tripId:trip.id,studentId:"kavin",reason:"Other trip student"}),/trip student/);
});

test("Excused students are not silently marked boarded, and double boarding across buses needs review",()=>{
 const{state,transport}=setup(),trip=open(state,transport);correctBoardingRecord(state,transport,{tripId:trip.id,studentId:"amaya",status:"excused",reason:"Not travelling this trip"});assert.equal(tap(state,transport,trip).code,"review_required");
 correctBoardingRecord(state,transport,{tripId:trip.id,studentId:"amaya",status:"boarded",reason:"Confirmed travel change"});state.students.find(student=>student.id==="amaya").bus="02";const second=open(state,transport,"02");assert.equal(tap(state,transport,second).code,"other_trip");assert.throws(()=>correctBoardingRecord(state,transport,{tripId:second.id,studentId:"amaya",status:"boarded",reason:"Second boarding"}),/other bus/);
});

test("Parents receive only the admission-selected child's status and history, including former bus trips",()=>{
 const{state,transport}=setup(),first=open(state,transport),second=open(state,transport,"02");tap(state,transport,first);tap(state,transport,second,"kavin");flagBoardingException(state,transport,{tripId:first.id,studentId:"amaya",reason:"PRIVATE_STAFF_REASON"});
 const ctx=parent(state),rows=parentBoardingRows(state,ctx);assert.equal(rows.length,1);assert.equal(rows[0].status,"boarded");assert.equal(rows[0].busId,"01");assert.doesNotMatch(JSON.stringify(rows),/Kavin|SCN-NFC|PRIVATE_STAFF_REASON|expected|token/);assert.equal(visibleBoardingTrips(state,ctx).length,0);
 const html=boardingPage({state,context:ctx,boarding:{}});assert.match(html,/Boarded/);assert.doesNotMatch(html,/Kavin|PRIVATE_STAFF_REASON|Review \/ correct|Simulate card tap/);
 state.students.find(student=>student.id==="amaya").bus="02";assert.equal(parentBoardingRows(state,ctx)[0].busId,"01");assert.equal(parentBoardingRows(state,parent(state,"SCN-1002"))[0].busId,"02");
});

test("Cross-school and stale-driver trip/reader/card writes are rejected without partial updates",()=>{
 const{state,transport,admin,driver}=setup(),trip=open(state,transport),foreign=contextFor(state,"transport","transport_l"),before=JSON.stringify(state);
 assert.throws(()=>boardingRows(state,foreign,trip.id),/access/);assert.throws(()=>simulateBoardingTap(state,contextFor(state,"driver","driver_02"),{tripId:trip.id,token:activeStudentCard(state,"amaya").token}),/access/);assert.throws(()=>setBoardingReader(state,foreign,{readerId:tripReader(state,trip).id,online:false}),/assigned bus/);assert.throws(()=>disableBoardingCard(state,contextFor(state,"admin","admin_l"),{cardId:activeStudentCard(state,"amaya").id,status:"lost",reason:"Foreign card"}),/active card/);assert.equal(JSON.stringify(state),before);
 state.accounts.find(person=>person.id==="driver_01").grants[0].bus="02";assert.throws(()=>simulateBoardingTap(state,driver,{tripId:trip.id,token:activeStudentCard(state,"amaya").token}),/appointment|access/);
});

test("Manifests use scoped statuses and formula-safe CSV without card tokens or private reasons",()=>{
 const{state,transport}=setup();state.students.find(student=>student.id==="amaya").name='=HYPERLINK("demo")';const trip=open(state,transport);correctBoardingRecord(state,transport,{tripId:trip.id,studentId:"amaya",status:"excused",reason:"PRIVATE_CORRECTION_REASON"});
 const report=boardingManifest(state,transport,trip.id),csv=reportCSV(report);assert.equal(report.customRows[0].status,"Not travelling");assert.match(csv,/'=HYPERLINK/);assert.doesNotMatch(csv,/PRIVATE_CORRECTION_REASON|SCN-NFC/);assert.throws(()=>boardingManifest(state,parent(state),trip.id),/access/);assert.throws(()=>boardingManifest(state,contextFor(state,"transport","transport_l"),trip.id),/access/);
});

test("Existing browser data receives NFC defaults once and preserves edits, disabled cards and histories",()=>{
 const{state,transport,admin}=setup(),original=structuredClone(state.assignments);const previous=globalThis.localStorage,storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 try{const old=structuredClone(state);for(const key of ["nfcVersion","nfcCards","nfcReaders","nfcTrips","nfcEvents","nfcSequence"])delete old[key];old.buses[0].name="Existing user route";storage.set("campusway-demo-v1",JSON.stringify(old));let migrated=loadState();assert.equal(migrated.nfcVersion,1);assert.equal(migrated.nfcCards.length,4);assert.equal(migrated.buses[0].name,"Existing user route");assert.deepEqual(migrated.assignments,original);
 const trip=open(migrated,contextFor(migrated,"transport","transport_c"));tap(migrated,contextFor(migrated,"transport","transport_c"),trip);disableBoardingCard(migrated,contextFor(migrated,"admin","admin_c"),{cardId:activeStudentCard(migrated,"amaya").id,status:"lost",reason:"Stored lost status"});assert.equal(saveState(migrated),true);const restored=loadState();for(const key of ["nfcCards","nfcReaders","nfcTrips","nfcEvents","nfcSequence"])assert.deepEqual(restored[key],migrated[key]);assert.equal(activeStudentCard(restored,"amaya"),undefined);
 }finally{globalThis.localStorage=previous;}
});

test("Trip and card reads stop exposing a student after an out-of-school record move",()=>{
 const{state,transport}=setup(),trip=open(state,transport);state.students.find(student=>student.id==="amaya").branch="lakeside";assert.equal(visibleBoardingTrips(state,transport).length,0);assert.equal(studentCards(state,"amaya").length,0);assert.equal(parentBoardingRows(state,parent(state)||{}).length,0);
});

test("An offline unknown token cannot become a valid historical scan by issuing that code later",()=>{
 const{state,transport,admin}=setup(),trip=open(state,transport),reader=tripReader(state,trip),old=activeStudentCard(state,"amaya");setBoardingReader(state,transport,{readerId:reader.id,online:false});simulateBoardingTap(state,transport,{tripId:trip.id,token:"ISSUED-LATER"});issueBoardingCard(state,admin,{studentId:"amaya",previousId:old.id,token:"ISSUED-LATER",reason:"Issued after unknown scan"});
 assert.equal(syncBoardingReader(state,transport,{readerId:reader.id})[0].code,"inactive_card");assert.equal(boardingRows(state,transport,trip.id)[0].status,"pending");
});

test("Queued scans for an unavailable roster retain a rejection receipt without exposing a student",()=>{
 const{state,transport}=setup(),trip=open(state,transport),reader=tripReader(state,trip);setBoardingReader(state,transport,{readerId:reader.id,online:false});tap(state,transport,trip);const receipt=reader.queue[0].id;state.students.find(student=>student.id==="amaya").branch="lakeside";
 assert.equal(syncBoardingReader(state,transport,{readerId:reader.id})[0].code,"unavailable");const event=state.nfcEvents.find(event=>event.receiptId===receipt);assert.equal(event.kind,"rejected");assert.equal(event.studentId,"");assert.equal(reader.queue.length,0);assert.equal(visibleBoardingTrips(state,transport).length,0);
});
