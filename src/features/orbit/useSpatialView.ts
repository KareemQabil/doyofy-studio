import {useEffect,useRef,useState,type PointerEvent as PE,type KeyboardEvent as KE} from 'react';
import {DEFAULT_VIEW,safeView,zoomAt,type CanvasView,type Point} from '../../domain/orbit';

/** Pan/pinch belongs only to this bounded canvas. Native page scrolling remains outside it. */
export function useSpatialView(){
 const frame=useRef<HTMLDivElement>(null),current=useRef<CanvasView>({...DEFAULT_VIEW});
 const [view,setView]=useState<CanvasView>(current.current);
 const pointers=useRef(new Map<number,Point>()),start=useRef<CanvasView|null>(null);
 const mode=useRef<{view:CanvasView;point:Point;distance?:number}|null>(null);
 const paint=(v:CanvasView)=>{current.current=safeView(v);const el=frame.current;if(el){el.style.setProperty('--pan-x',`${current.current.x}px`);el.style.setProperty('--pan-y',`${current.current.y}px`);el.style.setProperty('--zoom',String(current.current.scale));}};
 const commit=(v=current.current)=>{paint(v);setView({...current.current});};
 // The frame can remount when the list/space mode changes or query loading ends.
 useEffect(()=>{paint(current.current);});
 const center=():Point=>{const r=frame.current!.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};};
 const geometry=()=>{const a=[...pointers.current.values()];if(a.length>1)return{point:{x:(a[0]!.x+a[1]!.x)/2,y:(a[0]!.y+a[1]!.y)/2},distance:Math.max(1,Math.hypot(a[0]!.x-a[1]!.x,a[0]!.y-a[1]!.y))};return{point:a[0]!};};
 const restart=()=>{mode.current={view:{...current.current},...geometry()};};
 const end=(e:PE<HTMLDivElement>,cancelled:boolean)=>{
  if(!pointers.current.has(e.pointerId))return;
  if(cancelled){pointers.current.clear();if(start.current)commit(start.current);start.current=null;mode.current=null;frame.current?.removeAttribute('data-panning');return;}
  pointers.current.delete(e.pointerId);
  if(pointers.current.size)restart();else{commit();start.current=null;mode.current=null;frame.current?.removeAttribute('data-panning');}
 };
 return{frame,view,getScale:()=>current.current.scale,
  reset:()=>commit({...DEFAULT_VIEW}),zoom:(amount:number)=>commit(zoomAt(current.current,current.current.scale+amount)),pan:(dx:number,dy:number)=>commit({...current.current,x:current.current.x+dx,y:current.current.y+dy}),
  bind:{
   onPointerDown:(e:PE<HTMLDivElement>)=>{if(e.button!==0||pointers.current.size>=2||(e.target as Element).closest('button,a,input,select,textarea,[data-canvas-ignore]'))return;
    if(!pointers.current.size)start.current={...current.current};pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});restart();e.currentTarget.setPointerCapture?.(e.pointerId);e.currentTarget.setAttribute('data-panning','true');},
   onPointerMove:(e:PE<HTMLDivElement>)=>{if(!pointers.current.has(e.pointerId)||!mode.current)return;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=geometry(),m=mode.current;
    if(g.distance&&m.distance){const c=center(),f={x:m.point.x-c.x,y:m.point.y-c.y};const z=zoomAt(m.view,m.view.scale*g.distance/m.distance,f);paint({...z,x:z.x+g.point.x-m.point.x,y:z.y+g.point.y-m.point.y});}
    else paint({...m.view,x:m.view.x+g.point.x-m.point.x,y:m.view.y+g.point.y-m.point.y});},
   onPointerUp:(e:PE<HTMLDivElement>)=>end(e,false),onPointerCancel:(e:PE<HTMLDivElement>)=>end(e,true),onLostPointerCapture:(e:PE<HTMLDivElement>)=>end(e,true),
   onKeyDown:(e:KE<HTMLDivElement>)=>{if(e.target!==e.currentTarget)return;const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0'];if(!keys.includes(e.key))return;e.preventDefault();
    if(e.key==='0')commit({...DEFAULT_VIEW});else if(e.key==='+'||e.key==='=')commit(zoomAt(current.current,current.current.scale+.1));else if(e.key==='-')commit(zoomAt(current.current,current.current.scale-.1));else commit({...current.current,x:current.current.x+(e.key==='ArrowLeft'?-50:e.key==='ArrowRight'?50:0),y:current.current.y+(e.key==='ArrowUp'?-50:e.key==='ArrowDown'?50:0)});}
  }
 };
}
