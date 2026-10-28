import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { lockAxis, startsAtScreenEdge, type GestureAxis } from '../../domain/gestures';
export interface GestureEnd { delta: number; dx: number; dy: number; velocity: number; duration: number; moved: boolean; cancelled: boolean }
type PointerLike = { pointerId: number; clientX: number; clientY: number; timeStamp: number };
/** Bind only to an intentional gesture surface; never globally intercept scrolling.
 *  Controls inside the surface block the gesture unless they opt in with data-gesture-surface
 *  (e.g. deck cards, which are buttons you can also drag). */
export function usePointerGesture({ axis, enabled = true, onMove, onEnd, onStart }: {
  axis: GestureAxis; enabled?: boolean; onMove?: (delta: number) => void; onEnd: (gesture: GestureEnd) => void; onStart?: () => void;
}) {
  const state = useRef<{ id: number; x: number; y: number; t: number; locked: boolean; target: HTMLElement } | null>(null);
  const suppress = useRef(false);
  const detach = useRef<() => void>(() => {});
  useEffect(() => () => detach.current(), []);
  const finish = (e: PointerLike, cancelled: boolean) => {
    const s = state.current; if (!s || s.id !== e.pointerId) return;
    state.current = null;
    detach.current();
    if (s.target.hasPointerCapture?.(s.id)) s.target.releasePointerCapture(s.id);
    const dx=e.clientX-s.x,dy=e.clientY-s.y,duration=Math.max(16,e.timeStamp-s.t);
    cancelled=cancelled||!enabled;
    suppress.current=s.locked&&!cancelled;
    onEnd({dx,dy,delta:axis==='x'?dx:dy,velocity:(axis==='x'?dx:dy)/duration,duration,moved:s.locked,cancelled});
  };
  const move = (e: PointerLike) => {
    const s=state.current;if(!s || s.id!==e.pointerId)return;
    if(!enabled){finish(e,true);return;}
    const dx=e.clientX-s.x,dy=e.clientY-s.y;
    if(!s.locked){const lock=lockAxis(dx,dy,axis);if(lock==='rejected'){finish(e,true);return;}if(lock!=='locked')return;s.locked=true;s.target.setPointerCapture?.(e.pointerId);}
    onMove?.(axis==='x'?dx:dy);
  };
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      const control=(e.target as HTMLElement).closest('input,textarea,select,a,button,[role="button"],[contenteditable="true"],[data-gesture-ignore]');
      // a new primary pointer means the previous one is gone: its up/cancel was lost (released outside
      // before capture). Drop that stale gesture as cancelled instead of blocking this surface forever.
      const stale=state.current;
      if (stale && e.isPrimary!==false) { state.current=null; detach.current(); onEnd({dx:0,dy:0,delta:0,velocity:0,duration:16,moved:stale.locked,cancelled:true}); }
      if (!enabled || state.current || e.isPrimary===false || e.button!==0 || (control && !control.hasAttribute('data-gesture-surface'))) return;
      // the screen edges belong to the system back/forward swipe on phones
      if (e.pointerType==='touch' && axis==='x' && startsAtScreenEdge(e.clientX, window.innerWidth)) return;
      const surface=e.currentTarget;
      suppress.current=false;state.current={id:e.pointerId,x:e.clientX,y:e.clientY,t:e.timeStamp,locked:false,target:surface};onStart?.();
      // until the axis locks (and capture is taken) a fast mouse can leave the surface; follow it on the
      // window so the gesture still locks, ends and cleans up. Events inside the surface arrive via React.
      const outside=(ev: PointerEvent)=>{const t=ev.target as HTMLElement|null;return !(t && typeof t.nodeType==="number" && surface.contains(t));};
      const onWinMove=(ev: PointerEvent)=>{if(outside(ev))move(ev);};
      const onWinUp=(ev: PointerEvent)=>{if(outside(ev))finish(ev,false);};
      const onWinCancel=(ev: PointerEvent)=>{if(outside(ev))finish(ev,true);};
      detach.current();
      window.addEventListener('pointermove',onWinMove);window.addEventListener('pointerup',onWinUp);window.addEventListener('pointercancel',onWinCancel);
      detach.current=()=>{window.removeEventListener('pointermove',onWinMove);window.removeEventListener('pointerup',onWinUp);window.removeEventListener('pointercancel',onWinCancel);detach.current=()=>{};};
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => move(e),
    onPointerUp: (e: ReactPointerEvent<HTMLElement>)=>finish(e,false),
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>)=>finish(e,true),
    // lostpointercapture bubbles. A child may relinquish capture to this surface;
    // only losing capture owned by our active surface cancels its gesture.
    onLostPointerCapture: (e: ReactPointerEvent<HTMLElement>)=>{
      const s=state.current;
      if(s && e.pointerId===s.id && e.target===s.target) finish(e,true);
    },
    onClickCapture: (e: React.MouseEvent<HTMLElement>)=>{if(suppress.current){suppress.current=false;e.preventDefault();e.stopPropagation();}},
  };
}
