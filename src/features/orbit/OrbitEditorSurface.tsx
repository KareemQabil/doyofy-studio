import type {InvitationDesignContent} from '../../domain/types';
import {TemplateThumb} from '../templates/TemplateThumb';
import {Icon} from '../../ui';
import {OrbitArtwork} from './OrbitArtwork';
import {useSpatialView} from './useSpatialView';

export function OrbitEditorSurface({content,invitation}:{content:InvitationDesignContent;invitation:unknown}){
 const canvas=useSpatialView();
 return <div className="orbit-editor-surface"><div className="orbit-editor-canvas" ref={canvas.frame} {...canvas.bind} tabIndex={0} role="group" aria-label="منضدة الدعوة؛ اسحب للتفحّص وقرّب بإصبعين"><OrbitArtwork/><div className="orbit-editor-poster"><TemplateThumb preset={{id:'orbit-edit',name:'',line:'',styles:[],occasionTags:[],cardId:content.cardId,sceneId:content.sceneId,experience:content.experience}} invitation={invitation}/></div></div><div className="orbit-editor-zoom" role="group" aria-label="تقريب الدعوة"><button type="button" aria-label="تصغير الدعوة" onClick={()=>canvas.zoom(-.1)}>−</button><output>{Math.round(canvas.view.scale*100)}%</output><button type="button" aria-label="تكبير الدعوة" onClick={()=>canvas.zoom(.1)}>+</button><button type="button" aria-label="إعادة الدعوة للمنتصف" onClick={canvas.reset}><Icon name="refresh" size="sm"/></button></div><p className="orbit-editor-hint">اسحب لتتفحّصها · المعاينة تشغّل التجربة حيّة</p></div>;
}
