import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { lockAxis, type GestureAxis } from '../../domain/gestures';
export interface GestureEnd { delta: number; dx: number; dy: number; velocity: number; duration: number; moved: boolean; cancelled: boolean }
/** Bind only to an intentional gesture surface; never globally intercept scrolling.
 *  Controls inside the surface block the gesture unless they opt in with data-gesture-surface
 *  (e.g. deck cards, which are buttons you can also drag). */
export function usePointerGesture({ axis, enabled = true, onMove, onEnd, onStart }: {
  axis: GestureAxis; enabled?: boolean; onMove?: (delta: number) => void; onEnd: (gesture: GestureEnd) => void; onStart?: () => void;
}) {
  const state = useRef<{ id: number; x: number; y: number; t: number; locked: boolean; target: HTMLElement } | null>(null);
  const suppress = useRef(false);
  const finish = (e: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
    const s = state.current; if (!s || s.id !== e.pointerId) return;
    state.current = null;
    if (s.target.hasPointerCapture?.(s.id)) s.target.releasePointerCapture(s.id);
    const dx=e.clientX-s.x,dy=e.clientY-s.y,duration=Math.max(16,e.timeStamp-s.t);
    cancelled=cancelled||!enabled;
    suppress.current=s.locked&&!cancelled;
    onEnd({dx,dy,delta:axis==='x'?dx:dy,velocity:(axis==='x'?dx:dy)/duration,duration,moved:s.locked,cancelled});
  };
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      const control=(e.target as HTMLElement).closest('input,textarea,select,a,button,[role="button"],[contenteditable="true"],[data-gesture-ignore]');
      if (!enabled || state.current || e.isPrimary===false || e.button!==0 || (control && !control.hasAttribute('data-gesture-surface'))) return;
      suppress.current=false;state.current={id:e.pointerId,x:e.clientX,y:e.clientY,t:e.timeStamp,locked:false,target:e.currentTarget};onStart?.();
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const s=state.current;if(!s || s.id!==e.pointerId)return;
      if(!enabled){finish(e,true);return;}
      const dx=e.clientX-s.x,dy=e.clientY-s.y;
      if(!s.locked){const lock=lockAxis(dx,dy,axis);if(lock==='rejected'){finish(e,true);return;}if(lock!=='locked')return;s.locked=true;s.target.setPointerCapture?.(e.pointerId);}
      onMove?.(axis==='x'?dx:dy);
    },
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
