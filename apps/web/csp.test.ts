import{test,expect}from'vitest';
import{AbstractRenderer,GlUniformGroupSystem,UniformGroup}from'pixi.js';
test('Scene installs static Pixi uniform synchronization when dynamic Function is forbidden',async()=>{
 const NativeFunction=globalThis.Function;
 const blocked=function(){throw Error('CSP_UNSAFE_EVAL');} as unknown as FunctionConstructor;
 const guard=AbstractRenderer.prototype as unknown as {_unsafeEvalCheck():void};
 globalThis.Function=blocked;
 try{expect(()=>guard._unsafeEvalCheck()).toThrow('does not allow unsafe-eval');}finally{globalThis.Function=NativeFunction;}
 await import('./src/scene.js');
 globalThis.Function=blocked;
 try{
  expect(()=>guard._unsafeEvalCheck()).not.toThrow();
  const uniforms=GlUniformGroupSystem.prototype as unknown as {_generateUniformsSync(group:UniformGroup,data:Record<string,unknown>):(data:unknown,values:unknown,renderer:unknown)=>void};
  const group=new UniformGroup({alpha:{value:0.5,type:'f32'}});let called:number|undefined;
  const data={alpha:{value:0,location:7}};const sync=uniforms._generateUniformsSync(group,data);
  sync(data,{alpha:0.5},{gl:{uniform1f(_location:number,value:number){called=value;}}});
  expect(called).toBe(0.5);
 }finally{globalThis.Function=NativeFunction;}
});
