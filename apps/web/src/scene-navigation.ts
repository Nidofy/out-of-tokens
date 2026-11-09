import type {CameraZone,OfficeFocus} from './office-scene-spec.js';

export interface SceneCameraState {sceneFocus:OfficeFocus;editorFocus:OfficeFocus;cameraZone:CameraZone;}
export const initialSceneCamera:SceneCameraState={sceneFocus:null,editorFocus:null,cameraZone:'overview'};
type CameraAction={type:'locate'|'preview';focus:OfficeFocus}|{type:'zone';zone:CameraZone}|{type:'editor-close'|'reset'};
/** Editor previews never overwrite the underlying S1 camera, including its selected zone. */
export function sceneCamera(state:SceneCameraState,action:CameraAction):SceneCameraState{
 switch(action.type){
  case 'locate':return {...state,sceneFocus:action.focus};
  case 'zone':return {...state,sceneFocus:null,cameraZone:action.zone};
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
