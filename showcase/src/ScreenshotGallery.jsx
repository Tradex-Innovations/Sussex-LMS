import React, { useState } from 'react';
import { Icon } from './icons.jsx';
import { chapterScreens, screenshots, screenshotSource } from './screens.js';
import { prototypeBase } from './data.js';
export default function ScreenshotGallery({ chapter, onEnlarge }) {
 const list=chapterScreens[chapter], [selected,setSelected]=useState(list[0][0]);
 const id=list.some(([key])=>key===selected)?selected:list[0][0], shot=screenshots[id];
 return <div className={'screenshot-gallery'+(shot.mobile?' mobile-gallery':'')}>
  {list.length>1&&<div className="screen-tabs" aria-label="Transport screenshots">{list.map(([key,label])=><button key={key} aria-pressed={key===id} onClick={()=>setSelected(key)}>{label}</button>)}</div>}
  <button className={'prototype-shot '+(shot.mobile?'phone-shot':'browser-shot')} onClick={()=>onEnlarge(id)} aria-label={'Enlarge '+shot.title+' screenshot'}>
   {shot.mobile?<span className="shot-phone-island"/>:<span className="shot-window-bar"><i/><i/><i/><Icon name="expand" size={17}/></span>}
   <img key={id} src={screenshotSource(id)} alt={'Actual Sussex LMS prototype: '+shot.title} decoding="async"/>
  </button>
  <a className="open-screen" href={prototypeBase+'#'+shot.route} target="_blank" rel="noopener noreferrer">Open transport view<Icon name="external" size={16}/></a>
 </div>;
}
