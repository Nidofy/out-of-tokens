import {clampZoom,defaultCameraPan} from './office-scene-spec.js';
import type {CameraPan,CameraZone,OfficeFocus} from './office-scene-spec.js';

export interface SceneCameraState {sceneFocus:OfficeFocus;editorFocus:OfficeFocus;cameraZone:CameraZone;zoom:number;pan:CameraPan;}
export const initialSceneCamera:SceneCameraState={sceneFocus:null,editorFocus:null,cameraZone:'overview',zoom:1,pan:defaultCameraPan};
type CameraAction={type:'locate'|'preview';focus:OfficeFocus}|{type:'zone';zone:CameraZone}|{type:'zoom';zoom:number;pan?:CameraPan|undefined;clearFocus?:boolean|undefined}|{type:'pan';pan:CameraPan}|{type:'editor-close'|'reset'};
/** Editor previews never overwrite the underlying S1 camera, including its selected zone, zoom and pan. */
export function sceneCamera(state:SceneCameraState,action:CameraAction):SceneCameraState{
 switch(action.type){
  case 'locate':return {...state,sceneFocus:action.focus,zoom:1,pan:defaultCameraPan};
  case 'zone':return {...state,sceneFocus:null,cameraZone:action.zone,zoom:1,pan:defaultCameraPan};
  case 'zoom':{
   const clear=!!(action.clearFocus||(state.sceneFocus&&action.zoom<state.zoom));
   const p=action.pan??(clear?defaultCameraPan:state.pan);
   return {...state,sceneFocus:clear?null:state.sceneFocus,zoom:clampZoom(action.zoom),pan:{x:Number.isFinite(p.x)?p.x:0,y:Number.isFinite(p.y)?p.y:0}};
  }
  case 'pan':return {...state,pan:{x:Number.isFinite(action.pan.x)?action.pan.x:0,y:Number.isFinite(action.pan.y)?action.pan.y:0}};
  case 'preview':return {...state,editorFocus:action.focus};
  case 'editor-close':return {...state,editorFocus:null};
  case 'reset':return initialSceneCamera;
 }
}
/** Explicit dismissal restores focus; a modal owns its own focus and must never lose it. */
export function dismissPresence(open:boolean,reason:'escape'|'close'|'modal',modal:boolean){
 if(reason==='escape'&&modal)return {open,restoreFocus:false};
 return {open:false,restoreFocus:open&&reason!=='modal'&&!modal};
}
