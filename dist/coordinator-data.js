import { saveBusAssignment } from "./transport-records.js";
import { recordContext } from "./records.js";
import { networkFleet, networkTelemetry } from "./network-fleet.js";
import { schoolFollowups, followupStatuses } from "./vice-data.js";
import { statuses } from "./data.js";

export const coordinatorViews = [
  { id: "fleet", name: "Fleet Activity", short: "Fleet", icon: "map" },
  { id: "routes", name: "Routes & Stops", short: "Routes", icon: "route" },
  { id: "assignments", name: "Drivers & Students", short: "People", icon: "users" },
  { id: "issues", name: "Issues & Coordination", short: "Issues", icon: "alert" },
  { id: "reports", name: "Transport Reports", short: "Reports", icon: "file" },
];
export const coordinatorReportTypes = { brief: "Transport coordination brief", fleet: "Fleet activity snapshot", routes: "Route and stop register", students: "Student bus allocations", tasks: "Assigned transport issues" };
export const allocationStatuses = { all: "All school students", assigned: "Bus assigned", unassigned: "No valid bus assigned" };
export const driverStatuses = { all: "All school drivers", assigned: "Bus assigned", unassigned: "Awaiting bus assignment" };
export const coordinatorDefaults = () => ({ status: "all", busId: "", busFilter: "all", query: "", allocation: "all", driverStatus: "all", peopleTab: "students", taskStatus: "all", reportType: "brief", reportFormat: "csv", reportId: "", page: 1, mapFocus: "", resetMap: false });
export function coordinatorScope(state, context) {
  if (context?.role !== "transport" || context.grant?.role !== "transport") return null;
  try { const normalized = recordContext(state, context), branch = state.branches.find((branch) => branch.id === normalized.branch); return branch ? { context: normalized, branch, key: "transport:" + branch.id + ":" + normalized.account.id } : null; } catch { return null; }
}
function requireCoordinator(state, context) { const scope = coordinatorScope(state, context); if (!scope) throw new Error("An active Transport Coordinator school appointment is required."); return scope; }
export function coordinatorBuses(state, context) {
  const scope = requireCoordinator(state, context);
  return state.buses.filter((bus) => bus.branch === scope.branch.id);
}
export function coordinatorFleet(state, context) {
  const scope = requireCoordinator(state, context), ids = new Set(coordinatorBuses(state, context).map((bus) => bus.id));
  return networkFleet(state, [scope.branch]).filter((bus) => bus.operational && ids.has(bus.id));
}
export function coordinatorFilters(state, context, input = {}) {
  const buses = coordinatorBuses(state, context), status = input.status === "all" || Object.hasOwn(statuses, input.status) ? input.status : "all", visible = buses.filter((bus) => status === "all" || bus.status === status);
  return { ...coordinatorDefaults(), status, busId: visible.some((bus) => bus.id === input.busId) ? input.busId : visible[0]?.id || "", busFilter: buses.some((bus) => bus.id === input.busFilter) ? input.busFilter : "all",
    query: String(input.query || "").slice(0,80), allocation: Object.hasOwn(allocationStatuses,input.allocation)?input.allocation:"all", driverStatus: Object.hasOwn(driverStatuses,input.driverStatus)?input.driverStatus:"all",
    peopleTab: input.peopleTab === "drivers" ? "drivers" : "students", taskStatus: input.taskStatus === "all" || Object.hasOwn(followupStatuses,input.taskStatus) ? input.taskStatus : "all",
    reportType: Object.hasOwn(coordinatorReportTypes,input.reportType)?input.reportType:"brief", reportFormat: input.reportFormat === "html" ? "html" : "csv", reportId: String(input.reportId||""), page: Number.isInteger(Number(input.page))&&Number(input.page)>0 ? Number(input.page):1, mapFocus: buses.some((bus)=>bus.id===input.mapFocus)?input.mapFocus:"",resetMap:Boolean(input.resetMap) };
}
export function coordinatorDrivers(state, context, input = {}) {
  const scope = requireCoordinator(state, context), f = coordinatorFilters(state,context,input), buses=coordinatorBuses(state,context),query=f.query.trim().toLowerCase();
  return state.accounts.filter((person)=>person.grants.some((grant)=>grant.role==="driver"&&grant.branch===scope.branch.id)).map((person)=>({person,buses:buses.filter((bus)=>bus.driverId===person.id&&person.grants.some((grant)=>grant.role==="driver"&&grant.branch===bus.branch&&grant.bus===bus.id))})).filter((row)=>(f.busFilter==="all"||row.buses.some((bus)=>bus.id===f.busFilter))&&(f.driverStatus==="all"||f.driverStatus==="assigned"&&row.buses.length||f.driverStatus==="unassigned"&&!row.buses.length)&&(!query||[row.person.name,...row.buses.flatMap((bus)=>[bus.id,bus.name,bus.registration])].join(" ").toLowerCase().includes(query)));
}
export function coordinatorStudents(state, context, input = {}) {
  const scope=requireCoordinator(state,context), f=coordinatorFilters(state,context,input), buses=coordinatorBuses(state,context),query=f.query.trim().toLowerCase();
  return state.students.filter((student)=>student.branch===scope.branch.id).map((student)=>({student,bus:buses.find((bus)=>bus.id===student.bus)})).filter((row)=>(f.busFilter==="all"||row.bus?.id===f.busFilter)&&(f.allocation==="all"||f.allocation==="assigned"&&row.bus||f.allocation==="unassigned"&&!row.bus)&&(!query||[row.student.name,row.student.admissionNumber,row.student.className,row.bus?.id,row.bus?.name].join(" ").toLowerCase().includes(query)));
}
export function coordinatorRoutes(state,context,input={}) {
  const f=coordinatorFilters(state,context,input),query=f.query.trim().toLowerCase();
  return coordinatorBuses(state,context).filter((bus)=>(f.busFilter==="all"||bus.id===f.busFilter)&&(f.status==="all"||bus.status===f.status)&&(!query||[bus.id,bus.name,bus.registration,bus.driver,...bus.stops].join(" ").toLowerCase().includes(query)));
}
export function coordinatorTasks(state,context,input={}) {
  const scope=requireCoordinator(state,context),f=coordinatorFilters(state,context,input),ids=new Set(coordinatorBuses(state,context).map((bus)=>bus.id)),query=f.query.trim().toLowerCase();
  return schoolFollowups(state,scope.branch).filter((task)=>task.category==="transport"&&task.assignee===scope.context.account.id&&(!task.busId||ids.has(task.busId))&&(f.busFilter==="all"||task.busId===f.busFilter)&&(f.taskStatus==="all"||task.status===f.taskStatus)&&(!query||[task.title,task.busId].join(" ").toLowerCase().includes(query)));
}
export function saveCoordinatorTask(state,context,input) {
  const scope=requireCoordinator(state,context),previous=input.id?coordinatorTasks(state,context).find((task)=>task.id===input.id):null;
  if(input.id&&!previous)throw new Error("Choose a transport follow-up currently assigned to you in this school.");
  const bus=previous?.busId?coordinatorBuses(state,context).find((bus)=>bus.id===previous.busId):!previous?coordinatorBuses(state,context).find((bus)=>bus.id===input.busId):null;
  if(!previous&&!bus)throw new Error("Choose an operational bus from your school.");
  const title=previous?.title||String(input.title||"").trim(),note=String(input.note||"").trim(),due=previous?.due||input.due;
  if(!title||title.length>140||!note||note.length>1200)throw new Error("Enter an issue title and update note of up to 1,200 characters.");
  if(!/^2026-11-(?:20|2[1-7])$/.test(due))throw new Error("Choose a due date from 20 to 27 Nov 2026.");
  if(!Object.hasOwn(followupStatuses,input.status))throw new Error("Choose an open, in-progress or resolved status.");
  const task={...previous,id:previous?.id||"transport-followup-"+crypto.randomUUID(),branch:scope.branch.id,category:"transport",title,assignee:scope.context.account.id,due,status:input.status,
    ...(bus?{busId:bus.id}:{}),notes:[{text:note,by:scope.context.account.name,at:new Date().toISOString()},...(previous?.notes||[])].slice(0,20)};
  state.viceFollowups=[task,...(state.viceFollowups||[]).filter((item)=>item.id!==task.id)];
  return task;
}
export function coordinatorOverview(state,context) {
  const buses=coordinatorBuses(state,context),students=coordinatorStudents(state,context),drivers=coordinatorDrivers(state,context),tasks=coordinatorTasks(state,context);
  return {buses,students,drivers,tasks,route:buses.filter((bus)=>bus.status==="route").length,school:buses.filter((bus)=>bus.status==="school").length,delayed:buses.filter((bus)=>bus.status==="delayed").length,unassigned:buses.filter((bus)=>!drivers.some((row)=>row.buses.some((item)=>item.id===bus.id))).length,allocated:students.filter((row)=>row.bus).length};
}
export function visibleCoordinatorReports(state,context) {
  const scope=coordinatorScope(state,context);if(!scope)return[];
  const buses=new Set(coordinatorBuses(state,context).map((bus)=>bus.id)),students=new Set(coordinatorStudents(state,context).map((row)=>row.student.id)),tasks=new Set(coordinatorTasks(state,context).map((task)=>task.id));
  return(state.coordinatorReports||[]).filter((report)=>report.owner?.role==="transport"&&report.owner.key===scope.key&&report.criteria.scope.length===1&&report.criteria.scope[0]===scope.branch.id&&report.criteria.busIds.every((id)=>buses.has(id))&&report.criteria.studentIds.every((id)=>students.has(id))&&report.criteria.taskIds.every((id)=>tasks.has(id)));
}
export function generateCoordinatorReport(state,context,input={},telemetry={}) {
  const scope=requireCoordinator(state,context),f=coordinatorFilters(state,context,input);
  if(input.reportType&&!Object.hasOwn(coordinatorReportTypes,input.reportType))throw new Error("Choose a transport report type.");
  if(input.busFilter&&input.busFilter!=="all"&&!coordinatorBuses(state,context).some((bus)=>bus.id===input.busFilter))throw new Error("Reports must stay within your school’s operational fleet.");
  const criteria={status:["students","tasks"].includes(f.reportType)?"all":f.status,busFilter:f.busFilter,query:f.reportType==="brief"?"":f.query,allocation:f.reportType==="students"?f.allocation:"all",taskStatus:f.reportType==="tasks"?f.taskStatus:"all"};
  const buses=coordinatorRoutes(state,context,criteria),students=coordinatorStudents(state,context,criteria),tasks=coordinatorTasks(state,context,criteria),fleet=coordinatorFleet(state,context);
  let rows,columns,busIds=buses.map((bus)=>bus.id),studentIds=[],taskIds=[];
  if(f.reportType==="routes"){
    rows=buses.flatMap((bus)=>bus.stops.map((stop,index)=>({bus:bus.id,route:bus.name,order:index+1,stop,kind:index===bus.stops.length-1?"School destination":"Pickup stop"})));columns=[["bus","Bus"],["route","Route"],["order","Stop order"],["stop","Stop name"],["kind","Stop type"]];
  }else if(f.reportType==="students"){
    rows=students.map((row)=>({name:row.student.name,admission:row.student.admissionNumber,className:row.student.className,bus:row.bus?.id||"Unassigned",route:row.bus?.name||"—",driver:row.bus?.driver||"—"}));columns=[["name","Student"],["admission","Admission number"],["className","Class"],["bus","Assigned bus"],["route","Route"],["driver","Driver"]];studentIds=students.map((row)=>row.student.id);busIds=[...new Set(students.filter((row)=>row.bus).map((row)=>row.bus.id))];
  }else if(f.reportType==="tasks"){
    rows=tasks.map((task)=>({title:task.title,bus:task.busId||"School transport",due:task.due,status:followupStatuses[task.status],owner:scope.context.account.name}));columns=[["title","Transport issue / task"],["bus","Bus / scope"],["due","Due date"],["status","Status"],["owner","Assigned coordinator"]];taskIds=tasks.map((task)=>task.id);busIds=[...new Set(tasks.filter((task)=>task.busId).map((task)=>task.busId))];
  }else if(f.reportType==="fleet"){
    rows=buses.map((bus)=>{const details=fleet.find((item)=>item.id===bus.id),t=networkTelemetry(details,telemetry);return{bus:bus.id,registration:bus.registration,route:bus.name,driver:bus.driver,status:statuses[bus.status].label,next:t.nextStop,progress:Math.round(t.progress*100),eta:bus.status==="school"?"Arrived":t.eta+" min",signal:t.updated,lat:t.position?.[0]?.toFixed(5)||"Unavailable",lon:t.position?.[1]?.toFixed(5)||"Unavailable"};});columns=[["bus","Bus"],["registration","Vehicle"],["route","Route"],["driver","Driver"],["status","Saved status"],["next","Demo next stop"],["progress","Demo progress %"],["eta","Demo arrival estimate"],["signal","Simulated signal"],["lat","Simulated latitude"],["lon","Simulated longitude"]];
  }else{
    rows=buses.map((bus)=>({bus:bus.id,route:bus.name,status:statuses[bus.status].label,driver:bus.driver,students:coordinatorStudents(state,context,{busFilter:bus.id}).length,stops:bus.stops.length,issues:tasks.filter((task)=>task.busId===bus.id&&task.status!=="resolved").length}));columns=[["bus","Bus"],["route","Route"],["status","Saved status"],["driver","Driver"],["students","Assigned student records"],["stops","Stops"],["issues","Your open bus issues"]];studentIds=coordinatorStudents(state,context).filter((row)=>busIds.includes(row.bus?.id)).map((row)=>row.student.id);taskIds=tasks.filter((task)=>busIds.includes(task.busId)).map((task)=>task.id);
  }
  const generatedAt=new Date().toISOString(),date=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Colombo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(generatedAt));
  return{id:"coordinator-report-"+crypto.randomUUID(),title:coordinatorReportTypes[f.reportType],type:f.reportType,generatedAt,owner:{role:"transport",key:scope.key,school:scope.branch.school,by:scope.context.account.name},criteria:{...criteria,scope:[scope.branch.id],from:date,to:date,busIds,studentIds,taskIds},summary:{buses:busIds.length,students:f.reportType==="students"?students.length:studentIds.length,rows:rows.length},customColumns:columns,customRows:rows};
}

export function saveCoordinatorAllocation(state,context,input){
  requireCoordinator(state,context);
  const bus=coordinatorBuses(state,context).find((bus)=>bus.id===input.busId);
  if(!bus)throw new Error("Choose an operational bus from your school.");
  const students=coordinatorStudents(state,context,{busFilter:bus.id}).map((row)=>row.student.id);
  let driver=bus.driverId||"";
  if(input.kind==="student"){
    if(!coordinatorStudents(state,context).some((row)=>row.student.id===input.person))throw new Error("Choose a student from your appointed school.");
    if(!students.includes(input.person))students.push(input.person);
  }else if(input.kind==="driver"){
    if(!coordinatorDrivers(state,context).some((row)=>row.person.id===input.person))throw new Error("Choose a driver appointed to your school.");
    driver=input.person;
  }else throw new Error("Choose a driver or student allocation.");
  return saveBusAssignment(state,context,{id:bus.id,name:bus.name,driver,stops:bus.stops,students});
}
