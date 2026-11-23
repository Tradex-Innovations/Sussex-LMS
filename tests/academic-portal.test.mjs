import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, loadState } from '../dist/data.js';
import { contextFor, visibleCourses } from '../dist/access.js';
import { authenticateParent, parentContext } from '../dist/parent-login.js';
import { saveCourseAssignment, saveStudentRecord } from '../dist/records.js';
import { assignStudentSubjects, visibleClassNotices, saveClassNotice, markNoticeRead, visibleHomework, saveHomework, setHomeworkDone } from '../dist/academic-portal-data.js';
import { noticesPage, homeworkPage, teacherSubjectClasses } from '../dist/academic-portal.js';

function setup() { const state=freshState(), teacher=contextFor(state,'class_teacher','dilini'), subject=contextFor(state,'teacher','nuwan'), parent=parentContext(state,authenticateParent(state,'SCN-1001','1234')), child=state.students.find(s=>s.id==='amaya');return{state,teacher,subject,parent,child}; }
const homework={course:'science8',title:'Observe a leaf',instructions:'Draw and label a leaf.',due:'2026-11-25'};
test('Class Teacher selects each student’s parent-facing subjects without changing teachers or classmates',()=>{
 const{state,teacher,parent,child}=setup(),others=structuredClone(state.assignments.science8.students.filter(id=>id!=='amaya')),beforeTeacher=state.assignments.science8.teacher;
 assignStudentSubjects(state,teacher,{student:'amaya',subjects:['math8']});
 assert.deepEqual(visibleCourses(state,parent,child).map(c=>c.id),['math8']);assert.equal(state.assignments.science8.teacher,beforeTeacher);assert.deepEqual(state.assignments.science8.students,others);
 assignStudentSubjects(state,teacher,{student:'amaya',subjects:[]});assert.equal(visibleCourses(state,parent,child).length,0);
 assignStudentSubjects(state,teacher,{student:'amaya',subjects:['math8','science8']});assert.equal(visibleCourses(state,parent,child).length,2);
});
test('Subject selection rejects another class, grade, school, role and revoked appointment atomically',()=>{
 const{state,teacher,subject}=setup(),before=JSON.stringify(state);
 for(const input of[{student:'amaya',subjects:['science8b']},{student:'amaya',subjects:['english6']},{student:'amaya',subjects:['lake-math8']},{student:'amaya',subjects:['math8','math8']},{student:'dineth8b',subjects:['science8b']},{student:'meera',subjects:['lake-math8']}]){assert.throws(()=>assignStudentSubjects(state,teacher,input));assert.equal(JSON.stringify(state),before);}
 assert.throws(()=>assignStudentSubjects(state,subject,{student:'amaya',subjects:['science8']}));
 state.accounts.find(a=>a.id==='dilini').grants=state.accounts.find(a=>a.id==='dilini').grants.filter(g=>g.role!=='class_teacher');assert.throws(()=>assignStudentSubjects(state,teacher,{student:'amaya',subjects:[]}),/appointment/);
});
test('Administrative enrolment requires Class Teacher selection before a new subject appears to parents',()=>{
 const{state,teacher}=setup(),admin=contextFor(state,'admin','admin_c');const student=saveStudentRecord(state,admin,{branch:'colombo',name:'New pupil',admissionNumber:'SCN-NEW-88',grade:8,className:'8A',guardians:['parent']});
 saveCourseAssignment(state,admin,{course:'math8',teacher:'dilini',students:[...state.assignments.math8.students,student.id]});const parent=parentContext(state,authenticateParent(state,'SCN-NEW-88','1234'));assert.equal(visibleCourses(state,parent,student).length,0);
 assignStudentSubjects(state,teacher,{student:student.id,subjects:['math8']});assert.equal(visibleCourses(state,parent,student).length,1);
 saveCourseAssignment(state,admin,{course:'math8',teacher:'dilini',students:state.assignments.math8.students.filter(id=>id!==student.id)});assert.equal(visibleCourses(state,parent,student).length,0);
});
test('Common class notices reach class parents regardless of subject selection, with read and withdrawn states',()=>{
 const{state,teacher,parent,child}=setup();assignStudentSubjects(state,teacher,{student:'amaya',subjects:[]});const notice=saveClassNotice(state,teacher,{title:'Class trip',message:'Bring a water bottle.'});
 assert.ok(visibleClassNotices(state,parent,child).some(n=>n.id===notice.id));markNoticeRead(state,parent,child,notice.id);assert.equal(state.noticeReads['parent:amaya:'+notice.id],notice.updatedAt);
 assert.equal(visibleClassNotices(state,contextFor(state,'parent','parent_l'),state.students.find(s=>s.id==='meera')).some(n=>n.id===notice.id),false);
 assert.equal(visibleClassNotices(state,parent,state.students.find(s=>s.id==='kavin')).length,0);
 saveClassNotice(state,teacher,{...notice,status:'withdrawn'});assert.equal(visibleClassNotices(state,parent,child).some(n=>n.id===notice.id),false);
});
test('Only an appointed Class Teacher can publish or edit notices in that exact class',()=>{
 const{state,teacher,subject,parent,child}=setup(),foreign=state.classNotices.find(n=>n.branch==='lakeside'),before=JSON.stringify(state);
 for(const ctx of[subject,parent,contextFor(state,'principal','principal_c')])assert.throws(()=>saveClassNotice(state,ctx,{title:'No',message:'No'}));
 assert.throws(()=>saveClassNotice(state,teacher,{...foreign,title:'No'}));assert.throws(()=>markNoticeRead(state,parent,child,foreign.id));assert.equal(JSON.stringify(state),before);
});
test('Both teacher roles give subject/class homework; Subject Teacher classes remain isolated',()=>{
 const{state,teacher,subject,parent,child}=setup(),a=saveHomework(state,teacher,{...homework,title:'Class Teacher homework'}),b=saveHomework(state,subject,{...homework,course:'science8b',title:'8B homework'});
 assert.ok(visibleHomework(state,parent,child).some(h=>h.id===a.id));assert.ok(!visibleHomework(state,parent,child).some(h=>h.id===b.id));assert.ok(visibleHomework(state,subject).some(h=>h.id===b.id));assert.ok(!visibleHomework(state,teacher).some(h=>h.id===b.id));
 const html=teacherSubjectClasses({state,context:subject});assert.match(html,/Class 8A/);assert.match(html,/Class 8B/);
});
test('Homework writes reject foreign classes, other teachers, schools, stale appointments and invalid dates',()=>{
 const{state,teacher,subject,parent}=setup(),before=JSON.stringify(state);
 for(const[ctx,input]of[[teacher,{...homework,course:'science8b'}],[subject,{...homework,course:'math8'}],[subject,{...homework,course:'lake-science8'}],[parent,homework],[subject,{...homework,due:'2026-02-30'}]]){assert.throws(()=>saveHomework(state,ctx,input));assert.equal(JSON.stringify(state),before);}
 const item=saveHomework(state,subject,homework);state.assignments.science8.teacher='rihana';assert.throws(()=>saveHomework(state,subject,{...item,title:'Former teacher'}));assert.equal(visibleHomework(state,subject).some(h=>h.id===item.id),false);
});
test('Parent homework completion is child-scoped and separate from lecture completion and attendance',()=>{
 const{state,teacher,parent,child}=setup(),item=saveHomework(state,teacher,homework),notes=structuredClone(state.completed),attendance=structuredClone(state.classAttendance);
 setHomeworkDone(state,parent,child,item.id);assert.ok(state.homeworkCompleted.amaya[item.id]);assert.deepEqual(state.completed,notes);assert.deepEqual(state.classAttendance,attendance);
 assert.throws(()=>setHomeworkDone(state,parent,state.students.find(s=>s.id==='kavin'),item.id));
 assignStudentSubjects(state,teacher,{student:'amaya',subjects:['math8']});assert.throws(()=>setHomeworkDone(state,parent,child,item.id));assert.equal(visibleHomework(state,parent,child).some(h=>h.id===item.id),false);
});
test('Moving class clears subject approval, including after moving back and administrative re-enrolment',()=>{
 const{state,parent,child}=setup(),admin=contextFor(state,'admin','admin_c');
 saveStudentRecord(state,admin,{...child,grade:8,className:'8B'});assert.deepEqual(state.studentSubjects.amaya.subjects,[]);assert.equal(visibleCourses(state,parent,state.students.find(s=>s.id==='amaya')).length,0);
 saveStudentRecord(state,admin,{...child,grade:8,className:'8A'});saveCourseAssignment(state,admin,{course:'math8',teacher:'dilini',students:['amaya']});assert.equal(visibleCourses(state,parent,state.students.find(s=>s.id==='amaya')).length,0);
});
test('Browser migration preserves existing enrolments, custom records and later selections without re-seeding',()=>{
 const{state}=setup();delete state.academicPortalVersion;state.assignments.math8.students=['amaya'];state.assignments.math8.teacher='nuwan';state.completed.amaya=['CUSTOM'];globalThis.localStorage={getItem:()=>JSON.stringify(state)};let migrated=loadState();assert.deepEqual(migrated.assignments.math8.students,['amaya']);assert.equal(migrated.assignments.math8.teacher,'nuwan');assert.deepEqual(migrated.completed.amaya,['CUSTOM']);assert.deepEqual(migrated.studentSubjects.amaya.subjects,['math8','science8']);
 assignStudentSubjects(migrated,contextFor(migrated,'class_teacher','dilini'),{student:'amaya',subjects:[]});migrated.classNotices=[];migrated.homework=[];globalThis.localStorage={getItem:()=>JSON.stringify(migrated)};const reloaded=loadState();assert.deepEqual(reloaded.studentSubjects.amaya.subjects,[]);assert.deepEqual(reloaded.classNotices,[]);assert.deepEqual(reloaded.homework,[]);delete globalThis.localStorage;
});
test('Notices and homework render escaped content and omit staff review/private discussion text',()=>{
 const{state,teacher,parent,child}=setup();saveClassNotice(state,teacher,{title:'<script>',message:'<img onerror="bad()">'});saveHomework(state,teacher,{...homework,title:'<svg>',instructions:'<script>bad()</script>'});state.classDiscussions=[{note:'PRIVATE_DISCUSSION'}];state.subjectLearningReviews=[{note:'PRIVATE_REVIEW'}];
 const html=noticesPage({state,context:parent,child})+homeworkPage({state,context:parent,child,academicSubject:'all'});assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|<img onerror|PRIVATE_DISCUSSION|PRIVATE_REVIEW/);
});
