// Demo records only: no physical card or reader connection is made.
export function boardingSeed(students,buses){
  return { nfcVersion:1,nfcSequence:0,nfcCards:students.filter((student)=>buses.some((bus)=>bus.id===student.bus&&bus.branch===student.branch)).map((student,index)=>({id:"demo-card-"+student.id,token:"SCN-NFC-"+String(index+1).padStart(4,"0"),studentId:student.id,branch:student.branch,status:"active",issuedOrder:0,issuedAt:"2026-11-20T01:00:00.000Z",issuedBy:"Demo school office",changes:[]})),
    nfcReaders:buses.map((bus)=>({id:"SCN-READER-"+bus.id,busId:bus.id,branch:bus.branch,online:true,queue:[]})),nfcTrips:[],nfcEvents:[] };
}
