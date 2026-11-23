import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';
import { branches, islandPolygons, chapterScene } from './data.js';

const gold = '#e5bb65', navy = '#102c43';
const geometryCache = new Map();
function Round({ size, radius = .08, children, ...props }) {
  const key = [...size, radius].join(',');
  if (!geometryCache.has(key)) geometryCache.set(key, new RoundedBoxGeometry(...size, 3, radius));
  return <mesh geometry={geometryCache.get(key)} {...props}>{children}</mesh>;
}
function labelTexture(lines, background = '#f5f1df', color = '#16344d') {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 640;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = background; ctx.fillRect(0, 0, 1024, 640);
  ctx.fillStyle = '#b68a3b'; ctx.fillRect(64, 60, 74, 5);
  lines.forEach((line, index) => { ctx.font = `${index === 1 ? '700 76px' : index === 0 ? '600 29px' : '500 33px'} "DM Sans",Arial`; ctx.fillStyle = index === 0 ? '#ac843e' : color; ctx.fillText(line, 64, 122 + index * 102); });
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function useLabel(lines, background, color) {
  const key = lines.join('|'); const texture = useMemo(() => labelTexture(lines, background, color), [key, background, color]);
  useEffect(() => () => texture.dispose(), [texture]); return texture;
}
const project = (lon, lat) => [(lon - 80.66) * 2.45, -(lat - 7.85) * 2.45];
function RouteArc({ start, end, bright = false }) {
  const geometry = useMemo(() => {
    const a = project(start.lon, start.lat), b = project(end.lon, end.lat);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(a[0], .23, a[1]), new THREE.Vector3((a[0] + b[0]) / 2, Math.min(1.7, .4 + Math.hypot(a[0] - b[0], a[1] - b[1]) * .24), (a[1] + b[1]) / 2), new THREE.Vector3(b[0], .23, b[1]));
    return new THREE.TubeGeometry(curve, 32, bright ? .014 : .008, 5, false);
  }, [start.id, end.id, bright]);
  return <mesh geometry={geometry}><meshBasicMaterial color={bright ? gold : '#386178'} transparent opacity={bright ? .7 : .28}/></mesh>;
}
function Country({ selected, onSelect, paused, reduced }) {
  const ring = useRef();
  const geometries = useMemo(() => islandPolygons.map(polygon => {
    const shape = new THREE.Shape(); polygon.forEach(([lon, lat], index) => { const [x, z] = project(lon, lat); index ? shape.lineTo(x, -z) : shape.moveTo(x, -z); }); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: .19, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .035, bevelThickness: .035, curveSegments: 1 });
    geo.rotateX(-Math.PI / 2); return geo;
  }), []);
  const hub = branches.find(branch => branch.id === 'colombo');
  const current = branches.find(branch => branch.id === selected) || hub, point = project(current.lon, current.lat);
  useFrame(({ clock }) => { if (ring.current && !paused && !reduced) { const scale = 1 + Math.sin(clock.elapsedTime * 2) * .18; ring.current.scale.setScalar(scale); } });
  return <group position={[0, .1, 0]}>
    {geometries.map((geometry, index) => <group key={index}><mesh geometry={geometry} receiveShadow castShadow><meshStandardMaterial color="#173e54" roughness={.55} metalness={.48}/></mesh><lineSegments geometry={new THREE.EdgesGeometry(geometry, 25)}><lineBasicMaterial color="#7da0ac" transparent opacity={.23}/></lineSegments></group>)}
    {branches.filter(branch => branch.id !== hub.id).map(branch => <RouteArc key={branch.id} start={hub} end={branch} bright={branch.id === selected}/>)}
    {branches.map(branch => { const p = project(branch.lon, branch.lat), active = branch.id === selected; return <group key={branch.id} position={[p[0], .25, p[1]]}>
      <mesh onClick={event => { event.stopPropagation(); onSelect(branch.id); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}><sphereGeometry args={[active ? .085 : .047, 12, 12]}/><meshBasicMaterial color={active ? '#fff4cd' : '#e6b863'}/></mesh>
      {active && <><mesh position={[0, .43, 0]}><cylinderGeometry args={[.009, .009, .86, 6]}/><meshBasicMaterial color={gold} transparent opacity={.65}/></mesh><mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.11, .15, 32]}/><meshBasicMaterial color={gold} side={THREE.DoubleSide}/></mesh></>}
    </group>; })}
    <mesh ref={ring} position={[point[0], .255, point[1]]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.2, .215, 48]}/><meshBasicMaterial color={gold} transparent opacity={.45} side={THREE.DoubleSide}/></mesh>
  </group>;
}
function Wheel({ position, paused, reduced }) {
  const ref = useRef(); useFrame((_, delta) => { if (ref.current && !paused && !reduced) ref.current.rotation.z -= delta * .55; });
  return <group ref={ref} position={position}><mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.43, .43, .26, 28]}/><meshStandardMaterial color="#101b26" roughness={.95}/></mesh><mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, position[2] > 0 ? .145 : -.145]}><cylinderGeometry args={[.23, .23, .025, 24]}/><meshStandardMaterial color="#a9adb0" metalness={.85} roughness={.2}/></mesh><mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, position[2] > 0 ? .165 : -.165]}><cylinderGeometry args={[.09, .09, .025, 16]}/><meshStandardMaterial color={gold} metalness={.8} roughness={.3}/></mesh></group>;
}
function Bus({ paused, reduced, progress }) {
  const ref = useRef(); const label = useLabel(['SUSSEX COLLEGE NETWORK', 'SUSSEX', 'SCHOOL TRANSPORT'], '#e5bb65', '#16354d');
  useFrame(({ clock }) => { if (ref.current && !paused && !reduced) ref.current.position.y = .05 + Math.sin(clock.elapsedTime * 1.3) * .025; });
  return <group rotation={[0, -.5, 0]} position={[-.7 + progress * .55, .05, 0]} ref={ref}>
    <Round size={[5.6, 1.14, 1.85]} position={[0, .92, 0]} radius={.18} castShadow><meshStandardMaterial color={gold} metalness={.35} roughness={.38}/></Round>
    <Round size={[5.46, 1.27, 1.82]} position={[0, 1.92, 0]} radius={.19} castShadow><meshStandardMaterial color="#efce87" metalness={.2} roughness={.38}/></Round>
    <Round size={[5.3, .16, 1.73]} position={[0, 2.58, 0]} radius={.07}><meshStandardMaterial color="#f5db9e" roughness={.45}/></Round>
    {[-1, 1].map(side => <group key={side}>
      {[-2.16, -1.42, -.68, .06, .8, 1.54].map(x => <Round key={x} size={[.62, .75, .05]} position={[x, 1.98, side * .91]} radius={.05}><meshPhysicalMaterial color="#17384e" metalness={.42} roughness={.19} clearcoat={1}/></Round>)}
      <mesh position={[-.2, 1.15, side * .936]} rotation={[0, side < 0 ? Math.PI : 0, 0]}><planeGeometry args={[2.9, .52]}/><meshBasicMaterial map={label}/></mesh>
      <mesh position={[0, .65, side * .934]}><boxGeometry args={[5.3, .12, .024]}/><meshStandardMaterial color="#193d52" metalness={.4}/></mesh>
    </group>)}
    <Round size={[.055, .89, 1.42]} position={[2.72, 1.99, 0]} radius={.02}><meshPhysicalMaterial color="#16354c" metalness={.5} roughness={.2} clearcoat={1}/></Round>
    <Round size={[.04, 1.35, .57]} position={[1.95, 1.33, .952]} radius={.03}><meshStandardMaterial color="#16354b" metalness={.5} roughness={.25}/></Round>
    <mesh position={[1.95, 1.38, .98]}><boxGeometry args={[.025, 1.32, .025]}/><meshStandardMaterial color={gold}/></mesh>
    {[-.6, .6].map(z => <group key={z}><Round size={[.09, .19, .34]} position={[2.81, .93, z]} radius={.04}><meshStandardMaterial color="#fff5da" emissive="#ffe1a3" emissiveIntensity={.6}/></Round><Round size={[.06, .22, .15]} position={[-2.81, 1.02, z]} radius={.025}><meshStandardMaterial color="#dc765d" emissive="#7a1f1f"/></Round></group>)}
    <Round size={[.13, .2, 1.55]} position={[2.82, .58, 0]} radius={.04}><meshStandardMaterial color="#b9b6a8" metalness={.75} roughness={.3}/></Round>
    {[-1.72, 1.63].flatMap(x => [-1, 1].map(side => <Wheel key={x + ':' + side} position={[x, .45, side * .94]} paused={paused} reduced={reduced}/>))}
    <mesh position={[2.4, 2.12, 1.18]}><boxGeometry args={[.1, .38, .22]}/><meshStandardMaterial color="#18354b"/></mesh>
  </group>;
}
function BusStage({ paused, reduced, progress }) {
  const road = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-6, .01, 1), new THREE.Vector3(-2, .01, 0), new THREE.Vector3(3, .01, -.6), new THREE.Vector3(6, .01, -4)]), 64, .02, 6, false), []);
  return <group position={[0, .1, .2]}><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.02, 0]} receiveShadow><planeGeometry args={[24, 20]}/><meshStandardMaterial color="#0c2332" roughness={.7}/></mesh><mesh geometry={road}><meshBasicMaterial color="#ad8f52" transparent opacity={.6}/></mesh><Bus paused={paused} reduced={reduced} progress={progress}/><group position={[4.2, 0, -4]}><Round size={[2.3, 1.6, 1.1]} position={[0, .8, 0]} radius={.08}><meshStandardMaterial color="#31566a" roughness={.7}/></Round><mesh position={[0, 1.85, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[1.65, .9, 4]}/><meshStandardMaterial color="#b59355" metalness={.3} roughness={.6}/></mesh>{[-.7, 0, .7].map(x => <mesh key={x} position={[x, 1.05, .57]}><boxGeometry args={[.32, .47, .03]}/><meshStandardMaterial color="#d5bf85" emissive="#bda265" emissiveIntensity={.15}/></mesh>)}</group></group>;
}
function NfcStage({ demo, paused, reduced }) {
  const card = useRef(); const cardLabel = useLabel(['SUSSEX COLLEGE NETWORK', 'AMAYA PERERA', 'STUDENT TRANSPORT', 'Grade 8A  /  SCN-1001'], '#f4e4b8', '#17344b');
  const status = demo.offline ? 'OFFLINE' : demo.boarding === 'boarded' ? 'BOARDED' : 'READY TO TAP';
  const screen = useLabel(['BUS 01 / NFC READER', status, demo.queued ? '1 TAP QUEUED' : 'STUDENT TRANSPORT'], '#102735', demo.offline ? '#e5bb65' : '#9ce2bf');
  useEffect(() => { if (!card.current) return; gsap.killTweensOf(card.current.position); if (demo.tapMessage && !paused && !reduced) gsap.timeline().to(card.current.position, { x: .7, y: 1.0, z: .3, duration: .65, ease: 'power2.inOut' }).to(card.current.position, { x: -1.45, y: 2.1, z: .6, duration: .85, delay: .3, ease: 'power2.inOut' }); }, [demo.tapMessage, demo.queued, demo.boarding]);
  return <group rotation={[0, -.18, 0]} position={[-.2, 0, -.7]}>
    <Round size={[2.3, .55, 3.25]} position={[1.1, .45, 0]} radius={.19} castShadow><meshStandardMaterial color="#193c53" metalness={.55} roughness={.3}/></Round>
    <mesh position={[1.1, .731, -.35]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.9, 1.2]}/><meshBasicMaterial map={screen}/></mesh>
    {[.38, .58, .78].map(radius => <mesh key={radius} position={[1.1, .74, .65]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[radius, .014, 8, 48, Math.PI * .9]}/><meshStandardMaterial color={gold} emissive={gold} emissiveIntensity={.25}/></mesh>)}
    <mesh position={[1.1, .746, -1.3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.7, .035]}/><meshBasicMaterial color={demo.boarding === 'boarded' ? '#7ecaa6' : gold}/></mesh>
    <group ref={card} position={[-1.45, 2.1, .6]} rotation={[.18, -.25, -.22]}>
      <Round size={[3.25, .07, 2.1]} radius={.03} castShadow><meshStandardMaterial color="#e1bf70" metalness={.25} roughness={.35}/></Round>
      <mesh position={[0, .041, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.1, 1.98]}/><meshBasicMaterial map={cardLabel}/></mesh>
    </group>
  </group>;
}
function LearningStage({ demo }) {
  const tex = useLabel(['SUSSEX / LEARNING', 'A shared lesson.', demo.published ? 'Science lecture notes' : 'Teacher prepares materials', demo.completed ? 'PARENT: COMPLETED' : 'PARENT: READY TO LEARN'], '#e9efe8', '#163f40');
  return <group position={[.15, .2, -1]} rotation={[0, -.25, -.08]}><Round size={[4.5, 3.05, .18]} position={[0, 2.05, 0]} radius={.12} castShadow><meshStandardMaterial color="#192c3a" metalness={.5} roughness={.35}/></Round><mesh position={[0, 2.05, .105]}><planeGeometry args={[4.23, 2.68]}/><meshBasicMaterial map={tex}/></mesh>{[0, 1, 2].map(index => <Round key={index} size={[2.4, .23, 1.7]} position={[-2.1, .22 + index * .25, .5]} rotation={[0, index * .11, 0]} radius={.035} castShadow><meshStandardMaterial color={['#d7ad5a', '#326262', '#e1d8bd'][index]} roughness={.6}/></Round>)}</group>;
}
function SuppliesStage({ demo }) {
  const label = useLabel(['SUSSEX COLLEGE NETWORK', 'PUPIL’S BOOK', 'MATHEMATICS / GRADE 8', 'SCHOOL COLLECTION'], '#f3e6c8', '#183b51');
  return <group position={[0, 0, -.6]} rotation={[0, -.35, 0]}><mesh position={[0, .03, 0]} receiveShadow><cylinderGeometry args={[3.3, 3.3, .12, 64]}/><meshStandardMaterial color="#132d3b" metalness={.5} roughness={.4}/></mesh>{demo.supply === 'books' ? <group position={[-.5, .5, 0]} rotation={[-.15, .12, -.15]}>{[0, 1, 2].map(index => <Round key={index} size={[2.8, .22, 3.8]} position={[index * .09, index * .26, 0]} radius={.04} castShadow><meshStandardMaterial color={['#31576a', '#dfbf7b', '#f3e6c8'][index]} roughness={.6}/></Round>)}<mesh position={[.18, .65, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.65, 3.65]}/><meshBasicMaterial map={label}/></mesh></group> : <group position={[-.2, 1.45, 0]} rotation={[.05, 0, .04]}><Round size={[2.0, 2.5, .25]} radius={.09} castShadow><meshStandardMaterial color="#e7d9ba" roughness={.85}/></Round>{[-1, 1].map(side => <Round key={side} size={[.9, 1.3, .25]} position={[side * 1.2, .65, 0]} rotation={[0, 0, side * .6]} radius={.08} castShadow><meshStandardMaterial color="#e7d9ba" roughness={.85}/></Round>)}<mesh position={[0, .1, .14]}><boxGeometry args={[.035, 2.25, .02]}/><meshStandardMaterial color="#aa9776"/></mesh><Round size={[.45, .5, .025]} position={[-.52, .35, .145]} radius={.025}><meshStandardMaterial color="#dbcba7"/></Round><mesh position={[0, 1.26, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.34, .09, 10, 32, Math.PI]}/><meshStandardMaterial color="#bdad8a"/></mesh></group>}</group>;
}
function AnimatedWorld({ chapter, demo, dispatch, paused, reduced, onReady }) {
  const { camera, gl } = useThree(), root = useRef(), groups = useRef({}), target = useRef(new THREE.Vector3(0, .8, 0));
  const scene = chapterScene(chapter);
  useEffect(() => { const canvas = gl.domElement; const lost = event => { event.preventDefault(); window.dispatchEvent(new CustomEvent('showcase-context-lost')); }; canvas.addEventListener('webglcontextlost', lost); onReady(); return () => canvas.removeEventListener('webglcontextlost', lost); }, []);
  useEffect(() => {
    const instant = reduced || paused;
    for (const [name, group] of Object.entries(groups.current)) {
      if (!group) continue; gsap.killTweensOf(group.scale); gsap.killTweensOf(group.position);
      if (name === scene) { group.visible = true; gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: instant ? 0 : 1.1, ease: 'power3.out' }); gsap.to(group.position, { y: 0, duration: instant ? 0 : 1.1, ease: 'power3.out' }); }
      else gsap.to(group.scale, { x: .001, y: .001, z: .001, duration: instant ? 0 : .5, onComplete: () => { group.visible = false; } });
    }
    const positions = { map: [0, 8.8, 11.5], bus: [7.5, 5.2, 9.5], nfc: [4.2, 7.1, 8.3], learning: [3, 4.2, 9], supplies: [4.5, 6, 8.5] };
    gsap.killTweensOf(camera.position); gsap.to(camera.position, { x: positions[scene][0], y: positions[scene][1], z: positions[scene][2], duration: instant ? 0 : 1.4, ease: 'power2.inOut' });
    const next = scene === 'map' ? new THREE.Vector3(0, .3, 0) : new THREE.Vector3(0, 1, 0); gsap.to(target.current, { x: next.x, y: next.y, z: next.z, duration: instant ? 0 : 1.4 });
    return () => { for (const group of Object.values(groups.current)) if (group) { gsap.killTweensOf(group.scale); gsap.killTweensOf(group.position); } };
  }, [scene, reduced, paused]);
  useFrame(({ clock, pointer }) => { camera.lookAt(target.current); if (root.current && !paused && !reduced) { root.current.rotation.y = Math.sin(clock.elapsedTime * .12) * .035 + pointer.x * .025; } });
  return <group ref={root}>
    <ambientLight intensity={.85}/><hemisphereLight args={['#bedbe9', '#112c36', 1.5]}/><directionalLight position={[3, 10, 6]} intensity={3} color="#f7dfaa" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7}/><pointLight position={[-5, 4, -4]} intensity={38} color="#4e97be" distance={20}/>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.18, 0]} receiveShadow><circleGeometry args={[20, 64]}/><meshStandardMaterial color="#0a2030" roughness={.8} metalness={.3}/></mesh>
    <group ref={el => { groups.current.map = el; }} scale={scene === 'map' ? 1 : .001} visible={scene === 'map'}><Country selected={demo.branchId} onSelect={id => dispatch({ type: 'branch', id })} paused={paused} reduced={reduced}/></group>
    <group ref={el => { groups.current.bus = el; }} scale={.001} visible={false}><BusStage paused={paused} reduced={reduced} progress={demo.journey}/></group>
    <group ref={el => { groups.current.nfc = el; }} scale={.001} visible={false}><NfcStage demo={demo} paused={paused} reduced={reduced}/></group>
    <group ref={el => { groups.current.learning = el; }} scale={.001} visible={false}><LearningStage demo={demo}/></group>
    <group ref={el => { groups.current.supplies = el; }} scale={.001} visible={false}><SuppliesStage demo={demo}/></group>
  </group>;
}
export default function Scene(props) {
  return <Canvas shadows camera={{ position: [0, 8.8, 11.5], fov: 39, near: .1, far: 100 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.setClearColor('#071625', 0); gl.outputColorSpace = THREE.SRGBColorSpace; }}><Suspense fallback={null}><AnimatedWorld {...props}/></Suspense></Canvas>;
}
