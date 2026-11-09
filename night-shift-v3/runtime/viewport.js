/** HD-centered, no-letterbox fullscreen camera. Logical height 760, dynamic width. */
export function createViewport({canvas, worldHeight=760, centerX=600, pixelRatio, maxBackingPixels=Infinity, safeInset={left:28,right:28,top:118,bottom:76}}={}) {
 if(!(canvas instanceof HTMLCanvasElement))throw new TypeError('canvas required');
 const s={canvas,cssWidth:1,cssHeight:1,dpr:1,nativeDpr:1,backingWidth:1,backingHeight:1,worldHeight,worldWidth:1,originX:0,originY:0,scale:1,centerX,safeRect:null,resizeCount:0,hasBackingLimit:false};
 const subs=new Set(),insets={...safeInset};let dead=false;
 const getDpr=()=>typeof pixelRatio==='function'?pixelRatio():pixelRatio??window.devicePixelRatio??1;
 function safe(){const k=s.scale,left=s.originX+insets.left/k,right=s.originX+(s.cssWidth-insets.right)/k,top=insets.top/k,bottom=(s.cssHeight-insets.bottom)/k;
  return s.safeRect={x:left,y:top,left,right,top,bottom,width:Math.max(0,right-left),height:Math.max(0,bottom-top)};}
 function resize(){if(dead)return s;const b=canvas.getBoundingClientRect(),w=Math.max(1,b.width),h=Math.max(1,b.height),n=Math.max(1,Number(getDpr())||1);
  const factor=Number.isFinite(maxBackingPixels)&&maxBackingPixels>0?Math.min(1,Math.sqrt(maxBackingPixels/(w*h*n*n))):1;
  const d=n*factor,bw=Math.max(1,Math.round(w*d)),bh=Math.max(1,Math.round(h*d));
  const changed=w!==s.cssWidth||h!==s.cssHeight||d!==s.dpr||bw!==s.backingWidth||bh!==s.backingHeight;
  Object.assign(s,{cssWidth:w,cssHeight:h,dpr:d,nativeDpr:n,backingWidth:bw,backingHeight:bh,hasBackingLimit:factor<1,scale:h/worldHeight,worldWidth:w*worldHeight/h});
  s.originX=centerX-s.worldWidth/2;s.originY=0;if(canvas.width!==bw)canvas.width=bw;if(canvas.height!==bh)canvas.height=bh;safe();
  if(changed){s.resizeCount++;for(const fn of [...subs])fn(s);}return s;}
 s.setSafeInsets=o=>{for(const [k,v] of Object.entries(o))if(k in insets&&Number.isFinite(v))insets[k]=Math.max(0,v);return safe();};
 s.worldToScreen=(x,y)=>{if(typeof x==='object'){y=x.y;x=x.x;}return{x:(x-s.originX)*s.scale,y:(y-s.originY)*s.scale};};
 s.screenToWorld=(x,y)=>{if(typeof x==='object'){y=x.y;x=x.x;}return{x:x/s.scale+s.originX,y:y/s.scale+s.originY};};
 s.eventToWorld=e=>{const b=canvas.getBoundingClientRect();return s.screenToWorld(e.clientX-b.left,e.clientY-b.top);};
 s.applyWorldTransform=c=>{const k=s.dpr*s.scale;c.setTransform(k,0,0,k,-s.originX*k,-s.originY*k);};
 s.applyScreenTransform=c=>c.setTransform(s.dpr,0,0,s.dpr,0,0);
 s.worldBounds=()=>({x:s.originX,y:0,left:s.originX,top:0,right:s.originX+s.worldWidth,bottom:worldHeight,width:s.worldWidth,height:worldHeight});
 s.onResize=fn=>{subs.add(fn);return()=>subs.delete(fn);};s.resize=resize;
 const ro=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
 s.destroy=()=>{dead=true;ro?.disconnect();subs.clear();window.removeEventListener('resize',resize);window.removeEventListener('orientationchange',resize);window.visualViewport?.removeEventListener('resize',resize);};
 canvas.style.touchAction='none';ro?.observe(canvas);window.addEventListener('resize',resize,{passive:true});window.addEventListener('orientationchange',resize,{passive:true});window.visualViewport?.addEventListener('resize',resize,{passive:true});resize();return s;
}