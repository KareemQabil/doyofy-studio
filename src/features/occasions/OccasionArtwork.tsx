import type { EventType } from '../../domain/types';
import { useReviewSettings } from '../../app/review';
import { OccasionArt } from './OccasionArt';
import { OccasionGlyph } from '../../ui/icons';
import { toneOf } from '../signature/tones';

export const OCCASION_OBJECTS = [
  {id:'wedding',label:'بداية الحكاية',artwork:'assets/occasions/wedding-object.webp'},
  {id:'birthday',label:'يومك الجميل',artwork:'assets/occasions/birthday-object.webp'},
  {id:'graduation',label:'خطوة تستحق الاحتفال',artwork:'assets/occasions/graduation-object.webp'},
  {id:'newborn',label:'فرحة صغيرة تكبر',artwork:'assets/occasions/newborn-object.webp'},
  {id:'iftar',label:'على مائدة واحدة',artwork:'assets/occasions/iftar-object.webp'},
  {id:'family',label:'لمّة الأحباب',artwork:'assets/occasions/family-object.webp'},
  {id:'engagement',label:'وعد ببداية جميلة',artwork:'assets/occasions/engagement-object.webp'},
  {id:'katb_kitab',label:'حكاية توثّقها المحبة',artwork:'assets/occasions/katb_kitab-object.webp'},
  {id:'henna',label:'ليلة النقش والفرح',artwork:'assets/occasions/henna-object.webp'},
  {id:'conference',label:'أفكار تجمعنا',artwork:'assets/occasions/conference-object.webp'},
  {id:'opening',label:'أول باب للحكاية',artwork:'assets/occasions/opening-object.webp'},
  {id:'corporate',label:'فريق واحد وذكرى أجمل',artwork:'assets/occasions/corporate-object.webp'},
  {id:'other',label:'فرحة على ذوقك',artwork:'assets/occasions/other-object.webp'},
] as const;

/** Ink has line art; the other worlds pair tactile imagery with the existing drawn catalogue. */
export function OccasionArtwork({type,className='',framed=true}:{type:EventType;className?:string;framed?:boolean}){
  const {theme}=useReviewSettings();
  const art=OCCASION_OBJECTS.find(a=>a.id===type);
  // «توقيع» uses no generated imagery: a licensed Phosphor glyph on its brand colour tile
  if(theme==='signature')return <span className={`occ-art occ-sig-tile tone-${toneOf(type)} ${className}${framed?' is-framed':''}`} aria-hidden="true"><OccasionGlyph type={type} weight="light"/></span>;
  if(!art||theme==='ink')return <OccasionArt type={type} className={className} framed={framed}/>;
  return <span className={`occ-art occasion-object ${className}${framed?' is-framed':''}`} aria-hidden="true"><img src={art.artwork} alt="" loading="lazy" decoding="async" draggable={false}/></span>;
}
