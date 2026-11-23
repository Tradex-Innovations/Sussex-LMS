import React, { useState } from 'react';
import { Icon } from './icons.jsx';
import { chapterScreens, screenshots, screenshotSource, roleScreenshot } from './screens.js';
import { focusedTours, roleTours, prototypeBase } from './data.js';
export default function ScreenshotGallery({ chapter, demo, dispatch, onEnlarge, onAllRoles }) {
 const [selected,setSelected]=useState(chapterScreens[chapter]?.[0]?.[0] || 'network');
 const role=roleTours.find(item=>item.id===demo.roleId),id=chapter===6?roleScreenshot(demo.roleId,demo.tourStep):selected,shot=screenshots[id];
 const labels={chairman:['Transport','Academic','Reports'],principal:['Transport','Attendance','Reports'],parent:['Bus','Learning','Books'],driver:['Overview','Boarding','Issues']};
 return <div className={'screenshot-gallery'+(shot.mobile?' mobile-gallery':'')}>
  {chapter===6?<><div className="screen-tabs role-screen-tabs" aria-label="Role screenshots">{focusedTours.map(roleId=>{const item=roleTours.find(role=>role.id===roleId);return <button key={roleId} aria-pressed={roleId===demo.roleId} onClick={()=>dispatch({type:'role',id:roleId})}>{item.label}</button>;})}<button onClick={onAllRoles} aria-label="View all thirteen roles">All roles</button></div>{labels[role.id]&&<div className="screen-tabs screen-step-tabs" aria-label={role.label+' screens'}>{labels[role.id].map((label,index)=><button key={label} aria-pressed={demo.tourStep===index} onClick={()=>dispatch({type:'tour-step',value:index})}>{label}</button>)}</div>}</>:chapterScreens[chapter].length>1&&<div className="screen-tabs" aria-label="Prototype screenshots">{chapterScreens[chapter].map(([key,label])=><button key={key} aria-pressed={key===id} onClick={()=>setSelected(key)}>{label}</button>)}</div>}
  <button className={'prototype-shot '+(shot.mobile?'phone-shot':'browser-shot')} onClick={()=>onEnlarge(id)} aria-label={'Enlarge '+shot.title+' prototype screenshot'}>
   {shot.mobile?<span className="shot-phone-island"/>:<span className="shot-window-bar"><i/><i/><i/><Icon name="expand" size={17}/></span>}
   <img key={id} src={screenshotSource(id)} alt={'Actual Sussex LMS prototype: '+shot.title} width={shot.mobile?390:1440} height={shot.mobile?844:960} decoding="async"/>
  </button>
  <a className="open-screen" href={prototypeBase+'#'+shot.route} target="_blank" rel="noopener noreferrer">Open prototype<Icon name="external" size={16}/></a>
 </div>;
}
