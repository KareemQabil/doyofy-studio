import {useRef} from 'react';
/** Code-native kinetic sculpture: transparent lenses, a Möbius ribbon and an orbiting spark. */
export function OrbitArtwork({className='',interactive=false}:{className?:string;interactive?:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 return <div className={`orbit-artwork ${className}`} ref={ref} aria-hidden="true" onPointerMove={interactive?e=>{if(e.pointerType==='touch'||matchMedia('(prefers-reduced-motion:reduce)').matches)return;const r=e.currentTarget.getBoundingClientRect();ref.current?.style.setProperty('--art-x',`${(e.clientX-r.left)/Math.max(r.width,1)*16-8}deg`);ref.current?.style.setProperty('--art-y',`${(e.clientY-r.top)/Math.max(r.height,1)*-16+8}deg`);}:undefined} onPointerLeave={()=>{ref.current?.style.removeProperty('--art-x');ref.current?.style.removeProperty('--art-y');}}>
  <div className="orbit-sculpture"><i className="orbit-lens lens-a"/><i className="orbit-lens lens-b"/><i className="orbit-ribbon"/><i className="orbit-pearl pearl-a"/><i className="orbit-pearl pearl-b"/><i className="orbit-spark">✦</i><i className="orbit-shadow"/></div>
 </div>;
}
