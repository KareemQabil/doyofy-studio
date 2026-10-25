/** Spatial interaction math. These coordinates belong to the UI, never to event/guest data. */
export interface Point {x:number;y:number}
export interface CanvasView extends Point {scale:number}
export const DEFAULT_VIEW:CanvasView={x:0,y:0,scale:1};
export const limit=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
export const safeView=(v:CanvasView):CanvasView=>({x:limit(v.x,-650,650),y:limit(v.y,-480,480),scale:limit(v.scale,.7,1.6)});
export function zoomAt(view:CanvasView,scale:number,focal:Point={x:0,y:0}):CanvasView{
 const z=limit(scale,.7,1.6),ratio=z/view.scale;
 return safeView({scale:z,x:focal.x-(focal.x-view.x)*ratio,y:focal.y-(focal.y-view.y)*ratio});
}
export function placeNode(p:Point):Point{return{x:limit(Math.round(p.x/8)*8,90,910),y:limit(Math.round(p.y/8)*8,75,650)};}
export function readPositions(raw:string|null):Record<string,Point>{
 try{const v:unknown=JSON.parse(raw??'{}');if(!v||typeof v!=='object'||Array.isArray(v))return{};
  const out:Record<string,Point>={};for(const [k,p] of Object.entries(v)){if(!/^[a-z-]{1,30}$/.test(k)||!p||typeof p!=='object')continue;const{x,y}=p as Point;if(Number.isFinite(x)&&Number.isFinite(y))out[k]=placeNode({x,y});}return out;
 }catch{return{};}
}
export const ORBIT_POSITIONS:Point[]=[{x:200,y:130},{x:500,y:95},{x:800,y:150},{x:855,y:375},{x:750,y:595},{x:420,y:625},{x:155,y:490}];
