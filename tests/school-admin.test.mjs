import assert from "node:assert/strict";
import test from "node:test";
import { freshState, roles, saveState, loadState } from "../dist/data.js";
import { contextFor, can } from "../dist/access.js";
import { authenticateParent } from "../dist/parent-login.js";
import { saveStudentRecord, saveCourseAssignment } from "../dist/records.js";
import { adminScope, adminFilters, adminStudents, adminGuardians, adminCourses, adminOverview, generateAdminReport, visibleAdminReports } from "../dist/admin-data.js";
import { schoolAdminPage, adminReportHTML } from "../dist/school-admin.js";
import { reportCSV } from "../dist/chairman-data.js";

const setup = () => { const state=freshState(), context=contextFor(state,"admin","admin_c");return {state,context}; };
const admission = { branch:"colombo", name:"Demo Admissions Student", admissionNumber:"SCN-ADMIN-2026",grade:8,className:"8A",guardians:["parent"] };
const editInput = (state,id) => { const student=state.students.find(student=>student.id===id);return {...student}; };

test("School Administrator views require a current school appointment and preserve other role boundaries",()=>{
 const {state,context}=setup();assert.equal(roles.admin.start,"overview");assert.deepEqual(roles.admin.pages,["overview","fees","people","courses","boarding"]);
 assert.equal(adminScope(state,{...context,branch:"lakeside"}).branch.id,"colombo");
 assert.equal(adminScope(state,{...context,grant:{...context.grant,branch:"lakeside"}}),null);
 for(const role of ["principal","vice_principal","section_head","coordinator","class_teacher","teacher","parent"])assert.equal(adminScope(state,contextFor(state,role)),null);
 for(const permission of ["students.edit","courses.assign","courses.teacher"])assert.equal(can(context,permission),true);
 for(const permission of ["roles.manage","attendance.mark","materials.publish","transport.manage","library.manage"])assert.equal(can(context,permission),false);
 state.accounts.find(person=>person.id==="admin_c").grants=[];assert.equal(adminScope(state,context),null);assert.throws(()=>saveStudentRecord(state,context,admission),/appointment/);
});

test("Administrator filters, guardian links and enrolment counts stay inside the appointed school",()=>{
 const {state,context}=setup();assert.equal(adminOverview(state,context).students.length,9);assert.equal(adminOverview(state,context).guardians.length,1);assert.equal(adminOverview(state,context).courses.length,6);
 state.students.find(student=>student.id==="sara").guardians=["parent_l"];
 assert.equal(adminStudents(state,context,{query:"sara"})[0].guardians.length,0);
 assert.equal(adminGuardians(state,context).some(row=>row.person.id==="parent_l"),false);
 state.assignments.math8.students.push("meera","kavin");assert.equal(adminCourses(state,context,{query:"MAT 08"})[0].students.length,3);
 assert.ok(adminStudents(state,context,{grade:"8",className:"8A"}).every(row=>row.student.grade===8&&row.student.className==="8A"));
 assert.equal(adminStudents(state,context,{query:"SCN-1001"}).length,1);assert.ok(adminStudents(state,context,{studentStatus:"missing_guardian"}).length>0);
 assert.equal(adminFilters(state,context,{grade:"4",className:"8A"}).className,"all");
});

test("Registering an admission connects guardian login without inventing courses or attendance",()=>{
 const {state,context}=setup(),student=saveStudentRecord(state,context,{...admission,admissionNumber:"  scn-admin-2026  "});
 assert.equal(student.admissionNumber,"SCN-ADMIN-2026");assert.ok(authenticateParent(state,student.admissionNumber,"1234"));
 assert.equal(adminStudents(state,context,{query:student.admissionNumber})[0].courses.length,0);assert.equal(state.classAttendance,undefined);
 saveCourseAssignment(state,context,{course:"math8",teacher:"dilini",students:["amaya",student.id]});assert.equal(adminStudents(state,context,{query:student.admissionNumber})[0].courses.length,1);
});

test("Student admission validation rejects duplicates, wrong school/class and foreign guardians atomically",()=>{
 const {state,context}=setup(),before=JSON.stringify(state);
 for(const invalid of [{admissionNumber:"scn-1001"},{admissionNumber:"bad number"},{branch:"lakeside"},{className:"6A"},{grade:14},{name:""},{guardians:["parent_l"]},{guardians:["admin_c"]}]){assert.throws(()=>saveStudentRecord(state,context,{...admission,...invalid}));assert.equal(JSON.stringify(state),before);}
 assert.throws(()=>saveStudentRecord(state,context,{...editInput(state,"meera"),name:"Cross school"}),/assigned school/);assert.equal(JSON.stringify(state),before);
 assert.throws(()=>saveStudentRecord(state,contextFor(state,"class_teacher","dilini"),admission),/permission/);
});

test("Class and guardian edits preserve student identity, bus/history and remove incompatible enrolments",()=>{
 const {state,context}=setup(),original=structuredClone(state.students.find(student=>student.id==="amaya")),completed=structuredClone(state.completed),foreign=structuredClone(state.assignments["lake-math8"]);
 const updated=saveStudentRecord(state,context,{...editInput(state,"amaya"),grade:6,className:"6A",admissionNumber:"SCN-UPDATED-1001",guardians:[]});
 assert.equal(updated.id,original.id);assert.equal(updated.bus,original.bus);assert.ok(!state.assignments.math8.students.includes("amaya"));assert.ok(!state.assignments.science8.students.includes("amaya"));
 assert.deepEqual(state.completed,completed);assert.deepEqual(state.assignments["lake-math8"],foreign);assert.equal(authenticateParent(state,"SCN-1001","1234"),null);assert.equal(authenticateParent(state,updated.admissionNumber,"1234"),null);
});

test("Course assignment rejects other schools, classes and teachers without partial changes",()=>{
 const {state,context}=setup(),before=JSON.stringify(state.assignments);
 for(const invalid of [{course:"lake-math8",teacher:"lakshmi",students:["meera"]},{course:"math8",teacher:"lakshmi",students:["amaya"]},{course:"math8",teacher:"dilini",students:["meera"]},{course:"math8",teacher:"dilini",students:["kavin"]},{course:"math8",teacher:"dilini",students:["amaya","amaya"]}]){assert.throws(()=>saveCourseAssignment(state,context,invalid));assert.equal(JSON.stringify(state.assignments),before);}
 saveCourseAssignment(state,context,{course:"math8",teacher:"nuwan",students:["amaya"]});assert.deepEqual(state.assignments.math8,{teacher:"nuwan",students:["amaya"]});
 assert.throws(()=>saveCourseAssignment(state,contextFor(state,"teacher","dilini"),{course:"ict6",teacher:"dilini",students:[]}),/scope/);
});

test("Shared assignment writer retains Grade Coordinator teacher protection and Section Head section scope",()=>{
 const {state}=setup();saveCourseAssignment(state,contextFor(state,"coordinator","nuwan"),{course:"math8",teacher:"rihana",students:["amaya"]});assert.equal(state.assignments.math8.teacher,"dilini");
 assert.throws(()=>saveCourseAssignment(state,contextFor(state,"section_head","asha"),{course:"math8",teacher:"asha",students:["amaya"]}),/scope/);
 const principal=contextFor(state,"principal","principal_c");saveStudentRecord(state,principal,{...admission,admissionNumber:"SCN-PRINCIPAL-NEW"});assert.equal(adminStudents(state,contextFor(state,"admin","admin_c")).length,10);
});

test("Four administration reports include applied filters and omit private notes, passwords and synthetic metrics",()=>{
 const {state,context}=setup();state.classDiscussionNotes=[{student:"amaya",note:"PRIVATE_DISCUSSION"}];state.subjectLearningReviews=[{course:"math8",student:"amaya",status:"needs_practice",notes:[{text:"PRIVATE_LEARNING"}]}];
 for(const type of ["brief","students","guardians","courses"]){const report=generateAdminReport(state,context,{reportType:type,grade:"8",className:"8A",query:"Amaya"});
 assert.equal(report.owner.key,"admin:colombo");assert.deepEqual(report.criteria.scope,["colombo"]);assert.equal(report.criteria.grade,"8");
 for(const output of [JSON.stringify(report),reportCSV(report),adminReportHTML(report)])assert.doesNotMatch(output,/PRIVATE_|Malabe|undefined|Academic assessment|Attendance period|Temporary password 1234|"password"\s*:/);
 assert.match(reportCSV(report),/School Administrator/);assert.match(adminReportHTML(report),/School Administration/);
 if(type==="students"){assert.equal(report.customRows.length,1);assert.equal(report.customRows[0].admission,"SCN-1001");}
 if(type==="brief")assert.equal(report.criteria.query,"");}
 assert.throws(()=>generateAdminReport(state,context,{reportType:"staffing"}),/report type/);
});

test("School report history is isolated, immutable and hidden if captured records move outside its school",()=>{
 const {state,context}=setup(),report=generateAdminReport(state,context,{reportType:"students"});state.adminReports=[report];assert.equal(visibleAdminReports(state,context).length,1);
 assert.equal(visibleAdminReports(state,contextFor(state,"admin","admin_l")).length,0);assert.equal(visibleAdminReports(state,contextFor(state,"principal","principal_c")).length,0);
 state.accounts.push({id:"second_admin",name:"Second Administrator",grants:[{role:"admin",branch:"colombo"}]});assert.equal(visibleAdminReports(state,contextFor(state,"admin","second_admin")).length,1);
 const original=JSON.stringify(report);saveStudentRecord(state,context,{...editInput(state,"amaya"),name:"Updated sample name"});assert.equal(JSON.stringify(report),original);
 state.students.find(student=>student.id==="amaya").branch="lakeside";assert.equal(visibleAdminReports(state,context).length,0);
});

test("Administrator reports survive browser reload, sanitize CSV and escape HTML",()=>{
 const {state,context}=setup();state.students.find(student=>student.id==="amaya").name='=HYPERLINK("sample")';let report=generateAdminReport(state,context,{reportType:"students"});assert.match(reportCSV(report),/'=HYPERLINK/);
 state.students.find(student=>student.id==="amaya").name='<script>alert("sample")</script>';report=generateAdminReport(state,context,{reportType:"students"});assert.doesNotMatch(adminReportHTML(report),/<script>/);assert.match(adminReportHTML(report),/&lt;script&gt;/);
 state.adminReports=[report];const previous=globalThis.localStorage,storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 try{assert.equal(saveState(state),true);assert.deepEqual(loadState().adminReports,state.adminReports);}finally{globalThis.localStorage=previous;}
});

test("An appointed school without records renders five empty views without borrowing other-school records",()=>{
 const {state}=setup(),branch=state.branches.find(branch=>!["colombo","lakeside"].includes(branch.id));state.accounts.push({id:"empty_admin",name:"Empty School Administrator",grants:[{role:"admin",branch:branch.id}]});const context=contextFor(state,"admin","empty_admin");
 for(const view of ["summary","students","guardians","courses","reports"]){const html=schoolAdminPage({state,context,schoolAdmin:{...adminFilters(state,context),view}});assert.match(html,/SCHOOL ADMINISTRATION/);assert.doesNotMatch(html,/Amaya Perera|Nadeesha Perera|Dilini Silva/);}
 assert.equal(generateAdminReport(state,context).customRows.length,0);
});

test("Report totals follow matching report rows instead of applying a course search to student names",()=>{
 const {state,context}=setup();
 const course=generateAdminReport(state,context,{reportType:"courses",query:"Mathematics"});assert.equal(course.customRows.length,2);assert.equal(course.summary.courses,2);assert.equal(course.summary.students,4);assert.equal(course.summary.guardians,1);
 const student=generateAdminReport(state,context,{reportType:"students",query:"SCN-1001"});assert.equal(student.summary.students,1);assert.equal(student.summary.courses,2);assert.equal(student.summary.guardians,1);
 const guardian=generateAdminReport(state,context,{reportType:"guardians",query:"Nadeesha"});assert.equal(guardian.summary.guardians,1);assert.equal(guardian.summary.students,2);assert.equal(guardian.summary.courses,3);
});
