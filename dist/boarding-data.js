import { recordContext } from "./records.js";
import { linkedChildren } from "./access.js";

export const boardingRoles=["chairman","principal","vice_principal","transport","driver","admin","parent"];
export const boardingStatuses={pending:"Not yet boarded",boarded:"Boarded",unverified:"Needs review",not_boarded:"Confirmed not boarded",excused:"Not travelling"};
export const boardingDirections={to_school:"To school",from_school:"Return home"};
export const cardStatuses={active:"Active",lost:"Lost",inactive:"Deactivated",replaced:"Replaced"};
export function boardingDate(){const date=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Colombo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());return date>="2026-11-20"&&date<="2026-11-27"?date:"2026-11-20";}
export const boardingDefaults=()=>({tab:"trips",busId:"",tripId:"",date:boardingDate(),direction:"to_school",query:"",status:"all"});
export function boardingScope(state,context){
  if(!boardingRoles.includes(context?.role))return null;
  try{
    const ctx=recordContext(state,context),branches=state.branches.filter((branch)=>ctx.branch==="all"||branch.id===ctx.branch);
    if(!branches.length)return null;
    let buses=state.buses.filter((bus)=>branches.some((branch)=>branch.id===bus.branch));
    let child=null;
    if(ctx.role==="driver")buses=buses.filter((bus)=>bus.id===ctx.grant.bus&&bus.driverId===ctx.account.id);
    if(ctx.role==="parent"){
      child=linkedChildren(state,ctx).find((student)=>student.id===ctx.studentId);
      if(!child)return null;
      buses=buses.filter((bus)=>bus.id===child.bus&&bus.branch===child.branch);
    }
    return{context:ctx,branches,buses,child,canCards:["admin","principal","chairman"].includes(ctx.role),canOperate:["transport","driver"].includes(ctx.role),canReview:ctx.role==="transport",canRoster:!["parent","admin"].includes(ctx.role)};
  }catch{return null;}
}
const nextOrder=(state)=>state.nfcSequence=(state.nfcSequence||0)+1;
function requireScope(state,context){const scope=boardingScope(state,context);if(!scope)throw new Error("A current boarding workspace appointment is required.");return scope;}
export function boardingStudents(state,context){
  const scope=requireScope(state,context);
  if(!scope.canCards)return[];
  return state.students.filter((student)=>scope.branches.some((branch)=>branch.id===student.branch)&&(state.buses.some((bus)=>bus.id===student.bus&&bus.branch===student.branch)||studentCards(state,student.id).length));
}
export function studentCards(state,studentId){const student=state.students.find((student)=>student.id===studentId);return(state.nfcCards||[]).filter((card)=>card.studentId===studentId&&card.branch===student?.branch);}
export function activeStudentCard(state,studentId){return studentCards(state,studentId).find((card)=>card.status==="active");}
export function issueBoardingCard(state,context,input){
  const scope=requireScope(state,context),student=boardingStudents(state,context).find((student)=>student.id===input.studentId);
  if(!scope.canCards||!student||!state.buses.some((bus)=>bus.id===student.bus&&bus.branch===student.branch))throw new Error("Choose a school transport student within your card-management scope.");
  const token=String(input.token||"").trim().toUpperCase(),previous=input.previousId?(state.nfcCards||[]).find((card)=>card.id===input.previousId&&card.studentId===student.id&&card.branch===student.branch&&card.status!=="replaced"):null;
  if(input.previousId&&!previous)throw new Error("Choose this student’s current card for replacement.");
  if(!/^[A-Z0-9][A-Z0-9-]{3,39}$/.test(token))throw new Error("Use 4–40 letters, numbers or hyphens for the demo card code.");
  if((state.nfcCards||[]).some((card)=>card.token===token))throw new Error("That card code has already been used. Choose a new code.");
  const active=activeStudentCard(state,student.id);
  if(active&&active.id!==previous?.id)throw new Error("Replace the active card rather than issuing a second one.");
  const reason=String(input.reason||"").trim();
  if(!reason||reason.length>500)throw new Error("Record an issue/replacement reason of up to 500 characters.");
  const at=new Date().toISOString(),id="card-"+crypto.randomUUID(),order=nextOrder(state);
  if(previous){previous.status="replaced";previous.disabledAt??=at;previous.disabledOrder??=order;previous.replacedBy=id;previous.changes=[{action:"replaced",reason,by:scope.context.account.name,at},...(previous.changes||[])];}
  const card={id,token,studentId:student.id,branch:student.branch,status:"active",issuedAt:at,issuedOrder:order,issuedBy:scope.context.account.name,changes:[{action:previous?"replacement issued":"issued",reason,by:scope.context.account.name,at}]};
  state.nfcCards=[card,...(state.nfcCards||[])];return card;
}
export function disableBoardingCard(state,context,input){
  const scope=requireScope(state,context),card=(state.nfcCards||[]).find((card)=>card.id===input.cardId&&scope.branches.some((branch)=>branch.id===card.branch)&&state.students.some((student)=>student.id===card.studentId&&student.branch===card.branch));
  if(!scope.canCards||!card||card.status!=="active")throw new Error("Choose an active card in your school.");
  if(!["lost","inactive"].includes(input.status))throw new Error("Choose lost or deactivated.");
  const reason=String(input.reason||"").trim();if(!reason||reason.length>500)throw new Error("Record a reason for deactivating this card.");
  const at=new Date().toISOString();card.status=input.status;card.disabledAt=at;card.disabledOrder=nextOrder(state);card.changes=[{action:input.status,reason,by:scope.context.account.name,at},...(card.changes||[])];return card;
}
function schoolTripValid(state,trip){return state.buses.some((bus)=>bus.id===trip.busId&&bus.branch===trip.branch)&&trip.expected.every((entry)=>state.students.some((student)=>student.id===entry.studentId&&student.branch===trip.branch));}
export function visibleBoardingTrips(state,context){
  const scope=boardingScope(state,context);if(!scope?.canRoster)return[];
  const trips=(state.nfcTrips||[]).filter((trip)=>scope.buses.some((bus)=>bus.id===trip.busId&&bus.branch===trip.branch)&&schoolTripValid(state,trip));
  return scope.context.role==="driver"?trips.slice(0,1):trips;
}
export function boardingFilters(state,context,input={}){
  const scope=requireScope(state,context),trips=visibleBoardingTrips(state,context);
  const busId=scope.buses.some((bus)=>bus.id===input.busId)?input.busId:scope.buses[0]?.id||"";
  return{...boardingDefaults(),tab:scope.context.role==="admin"?"cards":input.tab==="cards"&&scope.canCards?"cards":"trips",busId,tripId:trips.some((trip)=>trip.id===input.tripId&&trip.busId===busId)?input.tripId:trips.find((trip)=>trip.busId===busId)?.id||"",query:String(input.query||"").slice(0,80),status:input.status==="all"||Object.hasOwn(boardingStatuses,input.status)?input.status:"all"};
}
export function createBoardingTrip(state,context,input){
  const scope=requireScope(state,context),bus=scope.buses.find((bus)=>bus.id===input.busId);
  if(!scope.canOperate||!bus)throw new Error("Choose your assigned operational bus.");
  if(!/^2026-11-(?:20|2[1-7])$/.test(input.date)||!Object.hasOwn(boardingDirections,input.direction))throw new Error("Choose a demo trip date from 20–27 Nov and a direction.");
  if((state.nfcTrips||[]).some((trip)=>trip.busId===bus.id&&trip.date===input.date&&trip.direction===input.direction))throw new Error("This bus already has a roster for that date and direction. Select the existing trip.");
  if((state.nfcTrips||[]).some((trip)=>trip.busId===bus.id&&trip.phase==="boarding"))throw new Error("Close this bus’s current pickup window before opening another roster.");
  if((state.nfcReaders||[]).find((reader)=>reader.busId===bus.id)?.queue?.length)throw new Error("Synchronise this bus’s queued taps before opening another roster.");
  const expected=state.students.filter((student)=>student.branch===bus.branch&&student.bus===bus.id).map((student)=>({studentId:student.id,name:student.name,admission:student.admissionNumber,className:student.className}));
  if(!expected.length)throw new Error("Allocate students to this bus before opening a boarding roster.");
  const trip={id:"trip-"+crypto.randomUUID(),busId:bus.id,branch:bus.branch,route:bus.name,date:input.date,direction:input.direction,phase:"boarding",openedAt:new Date().toISOString(),openedBy:scope.context.account.name,expected};
  state.nfcTrips=[trip,...(state.nfcTrips||[])];return trip;
}
function requireTrip(state,context,id,mode="read"){
  const scope=requireScope(state,context),trip=visibleBoardingTrips(state,context).find((trip)=>trip.id===id);
  if(!trip||mode==="operate"&&!scope.canOperate||mode==="review"&&!scope.canReview)throw new Error("This trip is outside your current boarding access.");
  return{scope,trip};
}
export function tripReader(state,trip){return(state.nfcReaders||[]).find((reader)=>reader.busId===trip.busId&&reader.branch===trip.branch);}
export function tripEvents(state,context,id){const{trip}=requireTrip(state,context,id);return(state.nfcEvents||[]).filter((event)=>event.tripId===trip.id&&event.branch===trip.branch);}
function latestRecord(state,trip,studentId){return(state.nfcEvents||[]).find((event)=>event.tripId===trip.id&&event.studentId===studentId&&["boarded","correction"].includes(event.kind));}
export function boardingRows(state,context,id){
  const{trip}=requireTrip(state,context,id),reader=tripReader(state,trip);
  return trip.expected.map((entry)=>{const event=latestRecord(state,trip,entry.studentId);return{...entry,status:event?.kind==="boarded"?"boarded":event?.status||(trip.phase==="closed"?"unverified":"pending"),at:event?.capturedAt||event?.at||"",source:event?.source||"",syncedAt:event?.syncedAt||"",readerOnline:Boolean(reader?.online),pendingSync:reader?.queue?.length||0};});
}
export function boardingSummary(rows){const counts=Object.fromEntries(Object.keys(boardingStatuses).map((status)=>[status,rows.filter((row)=>row.status===status).length]));return{...counts,expected:rows.length};}
function eventRecord(state,trip,input){const event={id:"event-"+crypto.randomUUID(),tripId:trip.id,branch:trip.branch,busId:trip.busId,at:new Date().toISOString(),...input};state.nfcEvents=[event,...(state.nfcEvents||[])];return event;}
function validateTap(state,trip,token,capturedAt,capturedOrder){
  const card=(state.nfcCards||[]).find((card)=>card.token===token);
  if(!card)return{code:"unknown_card",message:"Unknown card. Ask the school office to check it."};
  if(card.branch!==trip.branch)return{code:"wrong_school",message:"Card belongs to a different school. Boarding was not recorded."};
  if((card.issuedOrder||0)>capturedOrder||card.disabledOrder!==undefined&&card.disabledOrder<=capturedOrder||card.disabledOrder===undefined&&card.disabledAt&&card.disabledAt<=capturedAt)return{code:"inactive_card",message:"Card is lost, replaced or deactivated. Request a staff review."};
  const student=trip.expected.find((entry)=>entry.studentId===card.studentId);
  if(!student)return{code:"wrong_bus",message:"This card is not on this trip’s expected roster. Ask the coordinator to review it."};
  const current=latestRecord(state,trip,card.studentId),status=current?.kind==="boarded"?"boarded":current?.status;
  if(status==="boarded")return{code:"duplicate",message:"Already boarded. Repeated tap ignored.",studentId:card.studentId};
  if(status==="excused"||status==="not_boarded")return{code:"review_required",message:"A staff trip exception exists. Coordinator review is required.",studentId:card.studentId};
  const other=(state.nfcTrips||[]).find((item)=>item.id!==trip.id&&item.date===trip.date&&item.direction===trip.direction&&latestRecord(state,item,card.studentId)&&((latestRecord(state,item,card.studentId).kind==="boarded")||latestRecord(state,item,card.studentId).status==="boarded"));
  if(other)return{code:"other_trip",message:"Boarding is already recorded on another bus for this trip leg. Coordinator review is required.",studentId:card.studentId};
  return{code:"boarded",message:"Boarding recorded for "+student.name+".",studentId:card.studentId};
}
function processTap(state,trip,reader,token,capturedAt,capturedOrder,by,receiptId=""){
  if(receiptId&&(state.nfcEvents||[]).some((event)=>event.receiptId===receiptId))return{code:"duplicate_receipt",message:"This reader event is already synchronised."};
  const result=validateTap(state,trip,token,capturedAt,capturedOrder);
  eventRecord(state,trip,{kind:result.code==="boarded"?"boarded":result.code==="duplicate"?"duplicate":"rejected",code:result.code,studentId:result.studentId||"",token,readerId:reader.id,capturedAt,capturedOrder,syncedAt:new Date().toISOString(),source:"NFC simulation",by,message:result.message,...(receiptId?{receiptId}:{})});
  return result;
}
export function simulateBoardingTap(state,context,input){
  const{scope,trip}=requireTrip(state,context,input.tripId,"operate"),reader=tripReader(state,trip),token=String(input.token||"").trim().toUpperCase();
  if(trip.phase!=="boarding")throw new Error("The pickup window is closed. Ask the coordinator to record a correction.");
  if(!reader)throw new Error("No demo reader is registered to this bus.");
  if(!/^[A-Z0-9][A-Z0-9-]{3,39}$/.test(token))throw new Error("Enter a demo card code of 4–40 letters, numbers or hyphens.");
  const capturedAt=new Date().toISOString(),capturedOrder=nextOrder(state);
  if(!reader.online){reader.queue=[...(reader.queue||[]),{id:"queued-"+crypto.randomUUID(),tripId:trip.id,token,capturedAt,capturedOrder,by:scope.context.account.name}];return{code:"queued",message:"Reader offline: tap stored locally for synchronisation. Boarding is not yet confirmed."};}
  return processTap(state,trip,reader,token,capturedAt,capturedOrder,scope.context.account.name);
}
export function setBoardingReader(state,context,input){
  const scope=requireScope(state,context),reader=(state.nfcReaders||[]).find((reader)=>reader.id===input.readerId&&scope.buses.some((bus)=>bus.id===reader.busId&&bus.branch===reader.branch));
  if(!scope.canOperate||!reader||typeof input.online!=="boolean")throw new Error("Choose the reader on your assigned bus.");reader.online=input.online;return reader;
}
export function syncBoardingReader(state,context,input){
  const scope=requireScope(state,context),reader=(state.nfcReaders||[]).find((reader)=>reader.id===input.readerId&&scope.buses.some((bus)=>bus.id===reader.busId&&bus.branch===reader.branch));
  if(!scope.canOperate||!reader)throw new Error("Choose the reader on your assigned bus.");
  reader.online=true;const results=[];
  for(const queued of reader.queue||[]){const trip=(state.nfcTrips||[]).find((trip)=>trip.id===queued.tripId&&trip.busId===reader.busId&&trip.branch===reader.branch);if(trip&&schoolTripValid(state,trip))results.push(processTap(state,trip,reader,queued.token,queued.capturedAt,queued.capturedOrder,queued.by,queued.id));else { const result={code:"unavailable",message:"Queued trip no longer belongs to the accessible school roster."}; eventRecord(state,{id:queued.tripId,branch:reader.branch,busId:reader.busId},{kind:"rejected",code:result.code,studentId:"",token:queued.token,readerId:reader.id,capturedAt:queued.capturedAt,syncedAt:new Date().toISOString(),source:"NFC simulation",receiptId:queued.id,by:queued.by,message:result.message}); results.push(result); }}
  reader.queue=[];reader.lastSyncAt=new Date().toISOString();return results;
}
export function closeBoardingTrip(state,context,input){
  const{trip}=requireTrip(state,context,input.tripId,"review");if(trip.phase!=="boarding")throw new Error("This pickup window is already closed.");trip.phase="closed";trip.closedAt=new Date().toISOString();trip.closedBy=context.account.name;
  eventRecord(state,trip,{kind:"closed",message:"Pickup window closed; untapped students require review.",by:context.account.name,studentId:"",source:"Staff action"});return trip;
}
export function correctBoardingRecord(state,context,input){
  const{scope,trip}=requireTrip(state,context,input.tripId,"review"),entry=trip.expected.find((entry)=>entry.studentId===input.studentId),reader=tripReader(state,trip);
  if(!entry||!["boarded","not_boarded","excused","unverified"].includes(input.status))throw new Error("Choose a student and a valid transport status.");
  if(input.status==="not_boarded"&&(trip.phase!=="closed"||!reader?.online||reader.queue?.length))throw new Error("Close pickup and synchronise the reader before confirming not boarded.");
  if(input.status==="boarded"&&(state.nfcTrips||[]).some((other)=>other.id!==trip.id&&other.date===trip.date&&other.direction===trip.direction&&["boarded"].includes(latestRecord(state,other,entry.studentId)?.kind==="boarded"?"boarded":latestRecord(state,other,entry.studentId)?.status)))throw new Error("Review the existing boarding on the other bus before confirming this one.");
  const reason=String(input.reason||"").trim();if(!reason||reason.length>500)throw new Error("Record the reason for this correction (up to 500 characters).");
  return eventRecord(state,trip,{kind:"correction",studentId:entry.studentId,status:input.status,reason,by:scope.context.account.name,source:"Staff confirmation",message:boardingStatuses[input.status]+" confirmed by staff."});
}
export function flagBoardingException(state,context,input){
  const{scope,trip}=requireTrip(state,context,input.tripId,"operate"),entry=trip.expected.find((entry)=>entry.studentId===input.studentId),reason=String(input.reason||"").trim();
  if(!entry||!reason||reason.length>500)throw new Error("Select a trip student and describe the missed-card/scan concern.");
  return eventRecord(state,trip,{kind:"exception",studentId:entry.studentId,reason,by:scope.context.account.name,source:"Staff flag",message:"Boarding concern flagged for coordinator review."});
}
export function parentBoardingRows(state,context){
  const scope=boardingScope(state,context);if(!scope?.child)return[];const child=scope.child;
  return(state.nfcTrips||[]).filter((trip)=>trip.branch===child.branch&&trip.expected.some((entry)=>entry.studentId===child.id)&&state.buses.some((bus)=>bus.id===trip.busId&&bus.branch===child.branch)).map((trip)=>{const event=latestRecord(state,trip,child.id),reader=tripReader(state,trip);return{tripId:trip.id,date:trip.date,direction:trip.direction,busId:trip.busId,route:trip.route,phase:trip.phase,status:event?.kind==="boarded"?"boarded":event?.status||(trip.phase==="closed"?"unverified":"pending"),at:event?.capturedAt||event?.at||"",source:event?.source||"",pendingSync:reader?.queue?.length||0,readerOnline:Boolean(reader?.online)};});
}
export function boardingManifest(state,context,tripId){
  const{scope,trip}=requireTrip(state,context,tripId),rows=boardingRows(state,context,tripId);
  return{id:"boarding-manifest-"+crypto.randomUUID(),type:"boarding",title:"NFC boarding manifest · Bus "+trip.busId+" · "+boardingDirections[trip.direction],generatedAt:new Date().toISOString(),owner:{role:"boarding",key:scope.context.account.id,school:state.branches.find((branch)=>branch.id===trip.branch)?.school},criteria:{from:trip.date,to:trip.date,scope:[trip.branch]},customColumns:[["name","Student"],["admission","Admission number"],["className","Class"],["bus","Bus"],["direction","Direction"],["status","Transport status"],["at","Recorded event UTC"],["source","Source"],["reader","Reader status"],["pending","Reader events awaiting sync"]],customRows:rows.map((row)=>({name:row.name,admission:row.admission,className:row.className,bus:trip.busId,direction:boardingDirections[trip.direction],status:boardingStatuses[row.status],at:row.at,source:row.source,reader:row.readerOnline?"Online":"Offline",pending:row.pendingSync}))};
}
