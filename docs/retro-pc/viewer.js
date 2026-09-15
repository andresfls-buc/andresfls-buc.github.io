import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {ClassicDesktop} from './desktop.js';
import {personalizeNameplates} from './nameplate.js';
import {PowerButtonMotion} from './power-button-motion.js';
import {KeyboardMotion} from './keyboard-motion.js';
import {TouchDesktop} from './touch-desktop.js';

const $=s=>document.querySelector(s);
const stage=$('#stage'), viewer=$('#viewer'), status=$('#loading');
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(36,1,.1,100);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
const displayPixelRatio=Math.min(devicePixelRatio,1.7);
const context=renderer.getContext(),debugInfo=context.getExtension('WEBGL_debug_renderer_info');
const graphicsName=debugInfo?context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL):'';
const motionPixelRatio=Math.min(displayPixelRatio,/SwiftShader|llvmpipe|Software/i.test(graphicsName)?.65:1);
renderer.setPixelRatio(displayPixelRatio);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
stage.append(renderer.domElement);
// Draw the held cursor at a fixed size so browser cursor fallbacks cannot shrink it.
const dragCursor=document.createElement('img');
dragCursor.className='drag-cursor';dragCursor.alt='';dragCursor.draggable=false;
dragCursor.setAttribute('aria-hidden','true');
dragCursor.src=new URL('./assets/cursors/grabbing.svg',import.meta.url).href;
document.body.append(dragCursor);
const dragCursorReady=dragCursor.decode().catch(()=>{});
renderer.domElement.tabIndex=0;
renderer.domElement.setAttribute('aria-label','3D computer. Click the monitor or press Enter to enter the screen. Drag to rotate, scroll to zoom, R to reset, P to toggle power. On the desktop, Enter opens the folder, opens its file, or restores the minimized portfolio.');
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;
controls.minDistance=4;controls.maxDistance=24;
controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI*.49;controls.autoRotateSpeed=.75;
const home=new THREE.Vector3(5.7,4.1,8.7), homeTarget=new THREE.Vector3(.18,1.23,.40);
let buttonMotion,keyboardMotion;
let model,screenMesh,screenMaterial,indicatorState,screenLit=false;
let mode='orbit',flight=null,rotating=false,visible=true,frame=0,remaining=0,lastTime=0;
let previousPose=null,previousFocus=null,previousScroll=0;
let wallpaperTimer=0;
let placeholder=null,renderRect=null,focusProgress=0;
renderer.autoClear=false;
// The PC and lights are static: retain the shadow map while the camera moves.
renderer.shadowMap.autoUpdate=false;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const screenBounds=new THREE.Box3(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
// Local glTF bounds of the actual monitor and case power switches.
const powerSwitches={
  monitor:new THREE.Box3(new THREE.Vector3(.69,1.12,.94),new THREE.Vector3(.89,1.32,1.03)),
  case:new THREE.Box3(new THREE.Vector3(-.035,.34,.985),new THREE.Vector3(.145,.49,1.08))
};
const inertPeers=[...document.querySelectorAll('.intro-prompt')];
let inertStates=[];
const portfolioWindow=$('#portfolio-window');
const portfolioContent=$('#portfolio-content');
const shutdownWindow=$('#shutdown-window');
let shutdownTimer=0;
let touchDesktop;
const desktop=new ClassicDesktop(state=>{
  $('#desktop-announcement').textContent=state.folderOpen&&!state.minimized?'Folder open. Select portafolio and press Enter, or double-click the file to open it.':'Windows 2000 desktop. Open the portafolio folder.';
  touchDesktop?.sync();
  queueMicrotask(syncWallpaperMotion);
  requestRender();
},openShutdown,openPortfolio);
touchDesktop=new TouchDesktop($('#touch-desktop'),desktop,{openPortfolio,openShutdown});
touchDesktop.media.addEventListener('change',()=>{touchDesktop.setMode(mode);resize();});
function focusDesktop(){
  const host=$('#touch-desktop');
  if(!host.hidden){
    const selector=desktop.portfolioMinimized?'[data-action="portfolio-task"]':desktop.folderOpen&&!desktop.minimized?'.touch-file':'.touch-folder';
    host.querySelector(selector)?.focus({preventScroll:true});
  }else renderer.domElement.focus({preventScroll:true});
}
function openPortfolio(){
  desktop.portfolioRunning=true;desktop.portfolioMinimized=false;
  if(!portfolioContent.hasAttribute('src'))portfolioContent.src='../portfolio/';
  if(!portfolioWindow.open){
    if(touchDesktop.media.matches&&!portfolioWindow.classList.contains('is-maximized'))togglePortfolioSize();
    portfolioWindow.showModal();
  }
  desktop.draw();syncWallpaperMotion();
}
function closePortfolio(){
  desktop.portfolioRunning=false;desktop.portfolioMinimized=false;
  portfolioWindow.close();desktop.draw();syncWallpaperMotion();
}
function minimizePortfolio(){
  desktop.portfolioMinimized=true;
  portfolioWindow.close();desktop.draw();syncWallpaperMotion();
  $('#desktop-announcement').textContent='Portfolio minimized. Select portafolio — Website on the taskbar to restore it.';
}
function togglePortfolioSize(){
  const maximized=portfolioWindow.classList.toggle('is-maximized');
  const button=$('#maximize-portfolio');
  button.setAttribute('aria-pressed',String(maximized));
  button.setAttribute('aria-label',maximized?'Restore portfolio size':'Maximize portfolio');
  button.title=maximized?'Restore':'Maximize';
  button.firstElementChild.textContent=maximized?'❐':'□';
}

const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
const environment=pmrem.fromScene(room,.04);
scene.environment=environment.texture;scene.environmentIntensity=.5;
room.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xf5f2dc,0x293340,.85));
const key=new THREE.DirectionalLight(0xffedcf,1.6);
key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:20});
key.shadow.normalBias=.025;key.shadow.bias=-.0003;key.shadow.radius=3;scene.add(key);
const fill=new THREE.DirectionalLight(0xd4e6ff,.7);fill.position.set(5,4,2);scene.add(fill);
const rim=new THREE.DirectionalLight(0xe2ebf6,1);rim.position.set(-1,5,-4);scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x000000,opacity:.23}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.008;floor.receiveShadow=true;scene.add(floor);

function canAnimateWallpaper(){
  return !shutdownWindow.open&&!portfolioWindow.open&&model&&screenLit&&visible&&!document.hidden&&!reducedMotion.matches&&!flight&&
    (mode==='orbit'||mode==='desktop')&&!(desktop.folderOpen&&!desktop.minimized&&desktop.maximized);
}
function animateWallpaper(){
  wallpaperTimer=0;if(!canAnimateWallpaper())return;
  desktop.animateWallpaper(performance.now());requestRender();
  wallpaperTimer=setTimeout(animateWallpaper,mode==='desktop'?125:250);
}
function syncWallpaperMotion(){
  clearTimeout(wallpaperTimer);wallpaperTimer=0;
  if(canAnimateWallpaper())wallpaperTimer=setTimeout(animateWallpaper,mode==='desktop'?125:250);
}
reducedMotion.addEventListener('change',syncWallpaperMotion);
function requestRender(){
  remaining=2;
  if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(render);
}
function fullRect(){const r=stage.getBoundingClientRect();return {left:0,top:0,width:r.width,height:r.height};}
function rectOf(element){
  const r=element.getBoundingClientRect();
  return {left:r.left,top:r.top,width:r.width,height:r.height};
}
function mixRect(a,b,t){
  return {left:THREE.MathUtils.lerp(a.left,b.left,t),top:THREE.MathUtils.lerp(a.top,b.top,t),
    width:THREE.MathUtils.lerp(a.width,b.width,t),height:THREE.MathUtils.lerp(a.height,b.height,t)};
}
function setFocusProgress(value){
  focusProgress=value;
  viewer.style.setProperty('--focus-progress',String(value));
  viewer.style.setProperty('--focus-ui',String(THREE.MathUtils.smoothstep(value,.65,1)));
}
function render(time){
  frame=0;if(!visible||document.hidden)return;
  const delta=Math.min((time-lastTime)/1000,.05)||.016;lastTime=time;
  const buttonsMoving=buttonMotion?.update(time,delta);
  const keysMoving=keyboardMotion?.update(delta);
  if(buttonsMoving||keysMoving)renderer.shadowMap.needsUpdate=true;
  if(flight){
    const t=flight.duration===0?1:Math.min((time-flight.start)/flight.duration,1);
    // Zero velocity and zero acceleration at both ends, with a gentle orbital path.
    const eased=t*t*t*(t*(t*6-15)+10);
    controls.target.lerpVectors(flight.fromTarget,flight.toTarget,eased);
    const from=flight.fromSphere,to=flight.toSphere;
    const yaw=THREE.MathUtils.euclideanModulo(to.theta-from.theta+Math.PI,Math.PI*2)-Math.PI;
    const sphere=new THREE.Spherical(THREE.MathUtils.lerp(from.radius,to.radius,eased),
      THREE.MathUtils.lerp(from.phi,to.phi,eased),from.theta+yaw*eased);
    camera.position.setFromSpherical(sphere).add(controls.target);
    renderRect=mixRect(flight.fromRect,flight.toRect,eased);
    camera.fov=THREE.MathUtils.lerp(flight.fromFov,flight.toFov,eased);
    camera.aspect=renderRect.width/renderRect.height;
    camera.updateProjectionMatrix();camera.lookAt(controls.target);
    setFocusProgress(THREE.MathUtils.lerp(flight.fromFocus,flight.toFocus,eased));
    if(t===1){const done=flight.done;flight=null;done?.();}
  }else if(mode==='orbit')controls.update(delta);
  // Keep one full-size drawing buffer during the transition. A moving viewport
  // prevents the framing jump without reallocating GPU buffers every frame.
  const surface=renderer.domElement.getBoundingClientRect();
  renderer.setScissorTest(false);renderer.setViewport(0,0,surface.width,surface.height);
  renderer.clear();
  if(renderRect&&mode!=='orbit'){
    const r=renderRect,bottom=surface.height-r.top-r.height;
    renderer.setViewport(r.left,bottom,r.width,r.height);
    renderer.setScissor(r.left,bottom,r.width,r.height);renderer.setScissorTest(true);
  }
  renderer.render(scene,camera);
  if((keysMoving||buttonsMoving||flight||rotating||--remaining>0)&&!frame)frame=requestAnimationFrame(render);
}
function animateTo(position,target,done){
  const entering=mode==='entering';
  const toRect=entering?fullRect():rectOf(placeholder);
  flight={fromTarget:controls.target.clone(),toTarget:target.clone(),
    fromSphere:new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)),
    toSphere:new THREE.Spherical().setFromVector3(position.clone().sub(target)),
    fromRect:{...renderRect},toRect,fromFov:camera.fov,
    toFov:entering?36:(toRect.width<430?44:36),fromFocus:focusProgress,toFocus:entering?1:0,
    start:performance.now(),duration:reducedMotion.matches?0:(entering?1650:1450),done};
  requestRender();
}
function stopRotation(){
  rotating=false;controls.autoRotate=false;
}
function focusPose(aspect=stage.clientWidth/stage.clientHeight,fov=36){
  const center=screenBounds.getCenter(new THREE.Vector3());
  const size=screenBounds.getSize(new THREE.Vector3());
  const tan=Math.tan(THREE.MathUtils.degToRad(fov/2));
  const distance=Math.max(size.y/(2*tan*.72),size.x/(2*tan*aspect*.85));
  return {target:center,position:new THREE.Vector3(center.x,center.y,screenBounds.max.z+distance)};
}
function setInert(enabled){
  if(enabled){inertStates=inertPeers.map(el=>el.inert);inertPeers.forEach(el=>el.inert=true);}
  else inertPeers.forEach((el,i)=>el.inert=inertStates[i]??false);
}
function enterScreen(){
  if(!model||mode!=='orbit')return;
  stopRotation();controls.enableDamping=false;controls.update();controls.enableDamping=true;
  previousPose={position:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};
  previousFocus=document.activeElement;previousScroll=scrollY;
  const sourceRect=rectOf(stage);
  placeholder=document.createElement('div');placeholder.className='viewer viewer-placeholder';
  placeholder.setAttribute('aria-hidden','true');viewer.before(placeholder);
  mode='entering';syncGrabCursor();renderer.domElement.style.cursor='var(--cursor-arrow)';controls.enabled=false;renderer.setPixelRatio(motionPixelRatio);
  setPower(true);setInert(true);setFocusProgress(0);
  document.body.classList.add('screen-focused');
  renderRect=sourceRect;
  viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');
  viewer.setAttribute('aria-label','Windows 2000 desktop');
  $('#screen-toolbar').hidden=false;
  $('#back-to-pc').focus({preventScroll:true});
  visible=true;resize();
  const pose=focusPose();
  animateTo(pose.position,pose.target,()=>{mode='desktop';touchDesktop.setMode(mode);renderRect=fullRect();renderer.setPixelRatio(displayPixelRatio);resize();syncWallpaperMotion();requestRender();});
}
function finishExit(){
  mode='orbit';renderRect=null;renderer.setPixelRatio(displayPixelRatio);
  document.body.classList.remove('screen-focused');
  placeholder?.remove();placeholder=null;
  viewer.removeAttribute('role');viewer.removeAttribute('aria-modal');viewer.removeAttribute('aria-label');
  $('#screen-toolbar').hidden=true;
  setInert(false);controls.enabled=true;
  camera.position.copy(previousPose?.position??home);controls.target.copy(previousPose?.target??homeTarget);
  resize();controls.update();scrollTo(0,previousScroll);
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  syncWallpaperMotion();requestRender();
}
function exitScreen(){
  if(mode==='orbit'||mode==='leaving')return;
  mode='leaving';touchDesktop.setMode(mode);syncWallpaperMotion();renderer.setPixelRatio(motionPixelRatio);resize();
  animateTo(previousPose?.position??home,previousPose?.target??homeTarget,finishExit);
}
function homePosition(){
  const {width,height}=stage.getBoundingClientRect();
  const scale=Math.max(1,.80/(width/height));
  return home.clone().sub(homeTarget).multiplyScalar(scale).add(homeTarget);
}
function homeView(){
  if(mode!=='orbit'){exitScreen();return;}
  stopRotation();camera.position.copy(homePosition());controls.target.copy(homeTarget);controls.update();
  requestRender();
}
function resize(){
  const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;
  if(mode==='orbit'){
    renderer.setSize(width,height,false);camera.aspect=width/height;
    camera.fov=width<430?44:36;camera.updateProjectionMatrix();
  }else{
    renderer.setSize(width,height,false);
    if(screenMesh&&mode==='desktop'){
      const pose=focusPose();renderRect=fullRect();
      camera.fov=36;camera.aspect=width/height;
      camera.updateProjectionMatrix();camera.position.copy(pose.position);
      controls.target.copy(pose.target);camera.lookAt(pose.target);
    }else if(flight){
      flight.toRect=mode==='entering'?fullRect():rectOf(placeholder);
      if(mode==='entering'){
        const pose=focusPose();flight.toTarget.copy(pose.target);
        flight.toSphere.setFromVector3(pose.position.clone().sub(pose.target));
      }else flight.toFov=flight.toRect.width<430?44:36;
    }
  }
  requestRender();
}
function openShutdown(){
  if(shutdownTimer||!screenLit)return;
  desktop.startOpen=false;desktop.draw();
  $('#shutdown-action').value='shutdown';
  $('#shutdown-description').textContent='Closes the desktop and turns off the computer.';
  $('#shutdown-help').hidden=true;$('#shutdown-help-button').setAttribute('aria-expanded','false');
  $('#shutdown-status').hidden=true;
  shutdownWindow.showModal();syncWallpaperMotion();
}
function cancelShutdown(){
  if(shutdownTimer)return;
  shutdownWindow.close();focusDesktop();syncWallpaperMotion();
}
function confirmShutdown(event){
  event.preventDefault();if(shutdownTimer)return;
  const restart=$('#shutdown-action').value==='restart';
  shutdownWindow.setAttribute('aria-busy','true');
  shutdownWindow.querySelectorAll('button,select').forEach(control=>control.disabled=true);
  $('#shutdown-status').hidden=false;
  $('#shutdown-status').textContent=restart?'Windows is restarting…':'Windows is shutting down…';
  shutdownTimer=setTimeout(()=>{
    shutdownTimer=0;shutdownWindow.close();
    shutdownWindow.removeAttribute('aria-busy');
    shutdownWindow.querySelectorAll('button,select').forEach(control=>control.disabled=false);
    if(restart){
      closePortfolio();desktop.closeFolder();setPower(false);
      shutdownTimer=setTimeout(()=>{shutdownTimer=0;setPower(true);focusDesktop();},650);
    }else shutdownPC();
  },650);
}
$('#shutdown-form').addEventListener('submit',confirmShutdown);
$('#shutdown-cancel').addEventListener('click',cancelShutdown);
$('#shutdown-close').addEventListener('click',cancelShutdown);
shutdownWindow.addEventListener('cancel',event=>{event.preventDefault();cancelShutdown();});
$('#shutdown-action').addEventListener('change',()=>{
  $('#shutdown-description').textContent=$('#shutdown-action').value==='restart'?'Closes the desktop and starts Windows again.':'Closes the desktop and turns off the computer.';
});
$('#shutdown-help-button').addEventListener('click',()=>{
  const help=$('#shutdown-help');help.hidden=!help.hidden;
  $('#shutdown-help-button').setAttribute('aria-expanded',String(!help.hidden));
});
function shutdownPC(){
  closePortfolio();desktop.startOpen=false;desktop.closeFolder();setPower(false);
  if(mode!=='orbit')exitScreen();
}
function togglePower(button='monitor',animate=true){
  if(!model||shutdownTimer||mode==='entering'||mode==='leaving')return;
  if(animate){buttonMotion?.press(button,true);requestRender();}
  if(screenLit)shutdownPC();else enterScreen();
}
function isMonitor(hit){
  if(!hit||!model)return false;
  const point=model.worldToLocal(hit.point.clone());
  // Only the monitor can open the desktop. Keyboard gaps, its casing, the
  // mouse, and the computer tower must never act as an enter-screen button.
  return point.y>1.08&&point.y<2.96&&Math.abs(point.x)<1.12;
}
function isPowerSwitch(hit){
  if(!hit)return false;
  const point=model.worldToLocal(hit.point.clone());
  return Object.entries(powerSwitches).find(([,bounds])=>bounds.containsPoint(point))?.[0]||false;
}
function setPower(on){
  if(!screenMaterial)return;
  $('#touch-desktop').inert=!on;
  screenLit=on;screenMaterial.map=on?desktop.texture:null;screenMaterial.emissiveMap=on?desktop.texture:null;
  screenMaterial.color.set(on?0x141414:0x10151c);
  screenMaterial.emissive.set(on?0xffffff:0x000000);
  screenMaterial.emissiveIntensity=on?.96:0;screenMaterial.needsUpdate=true;
  if(indicatorState){
    const {material,color,emissive,intensity}=indicatorState;
    material.color.copy(color);material.emissive.copy(emissive);material.emissiveIntensity=on?intensity:0;
    if(!on){material.color.set(0x24351a);material.emissive.set(0x000000);}
  }
  $('#desktop-announcement').textContent=on?'Computer on. Open portafolio to explore.':'Computer off. Press the power button or click the monitor to turn it on.';
  $('#enter-screen span').textContent=on?'Click the monitor and explore my portfolio.':'Turn on the PC and explore my portfolio.';
  syncWallpaperMotion();requestRender();
}
controls.addEventListener('change',()=>{if(mode==='orbit')requestRender();});
controls.addEventListener('start',()=>{stopRotation();requestRender();});
new ResizeObserver(resize).observe(stage);
new IntersectionObserver(entries=>{visible=mode!=='orbit'||entries[0].isIntersecting;syncWallpaperMotion();if(visible)requestRender();}).observe(stage);
document.addEventListener('visibilitychange',()=>{syncWallpaperMotion();if(!document.hidden)requestRender();});

function intersection(event,object){
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
  camera.updateMatrixWorld();raycaster.setFromCamera(pointer,camera);
  return raycaster.intersectObject(object,true)[0];
}
// A drag or a multi-touch gesture must never activate the click-to-enter action.
const pointers=new Map();let gestureWasDrag=false;
function positionDragCursor(e){
  dragCursor.style.transform=`translate3d(${Math.round(e.clientX)-16}px,${Math.round(e.clientY)-16}px,0)`;
}
function syncGrabCursor(){
  const grabbing=mode==='orbit'&&Boolean(model)&&[...pointers.values()].some(p=>p.rotate);
  const fixedCursor=grabbing&&dragCursor.complete&&dragCursor.naturalWidth>0;
  document.documentElement.classList.toggle('is-grabbing',fixedCursor);
  renderer.domElement.classList.toggle('is-grabbing',grabbing&&!fixedCursor);
}
// Prevent OrbitControls from starting a drag on an individual key.
renderer.domElement.addEventListener('pointerdown',e=>{
  if(model&&e.button===0&&!shutdownTimer&&(mode==='orbit'||mode==='desktop')&&keyboardMotion?.hit(intersection(e,model)))controls.enabled=false;
},true);
renderer.domElement.addEventListener('pointerdown',e=>{
  if(pointers.size===0)gestureWasDrag=false;
  const hit=model&&e.button===0&&!shutdownTimer&&(mode==='orbit'||mode==='desktop')?intersection(e,model):null;
  const power=isPowerSwitch(hit),key=keyboardMotion?.hit(hit);
  if(key){keyboardMotion.press(key,e.pointerId);requestRender();}
  if(power&&pointers.size===0){buttonMotion?.press(power);controls.enabled=false;requestRender();}
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,power,key,enterMonitor:isMonitor(hit),rotate:!key&&!power&&mode==='orbit'&&e.button===0&&e.pointerType!=='touch'});
  positionDragCursor(e);syncGrabCursor();
  if(pointers.size>1){gestureWasDrag=true;buttonMotion?.release();requestRender();}
  if(key||power||mode!=='orbit')renderer.domElement.setPointerCapture(e.pointerId);
});
function updatePointerCursor(e){
  if(!model||pointers.size)return;
  const hit=intersection(e,model);
  const power=isPowerSwitch(hit);
  if(keyboardMotion?.hit(hit)){renderer.domElement.title='Press key';renderer.domElement.style.cursor='var(--cursor-link)';return;}
  renderer.domElement.title=power?(screenLit?'Turn off the PC':'Turn on the PC'):'';
  if(power){desktop.hover(null,null);renderer.domElement.style.cursor='var(--cursor-link)';return;}
  if(mode==='orbit')renderer.domElement.style.cursor=isMonitor(hit)?'var(--cursor-link)':'var(--cursor-arrow)';
  else if(mode==='desktop'){
    if(hit?.object===screenMesh&&hit.uv){
      const x=hit.uv.x*1024,y=hit.uv.y*768;
      desktop.hover(x,y);
      renderer.domElement.style.cursor=['window','desktop','dismiss-start','glass'].includes(desktop.hit(x,y))?'var(--cursor-arrow)':'var(--cursor-link)';
    }else {desktop.hover(null,null);renderer.domElement.style.cursor='var(--cursor-arrow)';}
  }
}
renderer.domElement.addEventListener('pointermove',e=>{
  const start=pointers.get(e.pointerId);
  if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)gestureWasDrag=true;
  updatePointerCursor(e);
});
renderer.domElement.addEventListener('pointerup',e=>{
  const start=pointers.get(e.pointerId);pointers.delete(e.pointerId);
  if(start?.key){keyboardMotion.release(e.pointerId);controls.enabled=mode==='orbit'&&!keyboardMotion.presses.size;requestRender();}
  if(start?.power){buttonMotion?.release();controls.enabled=mode==='orbit';requestRender();}
  syncGrabCursor();updatePointerCursor(e);
  if(!start||gestureWasDrag||e.button!==0||!model||shutdownTimer)return;
  if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)return;
  if(mode!=='orbit'&&mode!=='desktop')return;
  const hit=intersection(e,model);
  const power=isPowerSwitch(hit);
  if(power&&start.power===power){togglePower(power,false);return;}
  if(start.power||start.key)return;
  if(mode==='orbit'){
    if(start.enterMonitor&&isMonitor(hit))enterScreen();
  }else if(screenLit&&hit?.object===screenMesh&&hit.uv){
    desktop.click(hit.uv.x*1024,hit.uv.y*768);
  }
});
renderer.domElement.addEventListener('pointercancel',e=>{keyboardMotion?.release(e.pointerId);buttonMotion?.release();controls.enabled=mode==='orbit';requestRender();pointers.delete(e.pointerId);gestureWasDrag=true;syncGrabCursor();updatePointerCursor(e);});
// Capture can change while the button is still held. End the cursor on release,
// cancellation, or blur, including when release happens outside the canvas.
renderer.domElement.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId)){gestureWasDrag=true;keyboardMotion?.release(e.pointerId);controls.enabled=mode==='orbit'&&!keyboardMotion?.presses.size;requestRender();}});
function releaseOutsideCanvas(e){
  if(!pointers.has(e.pointerId))return;
  keyboardMotion?.release(e.pointerId);buttonMotion?.release();controls.enabled=mode==='orbit'&&!keyboardMotion?.presses.size;requestRender();
  pointers.delete(e.pointerId);gestureWasDrag=true;syncGrabCursor();updatePointerCursor(e);
}
window.addEventListener('pointerup',releaseOutsideCanvas);
window.addEventListener('pointercancel',releaseOutsideCanvas);
window.addEventListener('pointermove',e=>{
  const held=pointers.get(e.pointerId);
  if(!held?.rotate)return;
  if(!(e.buttons&1)){releaseOutsideCanvas(e);return;}
  positionDragCursor(e);
},true);
window.addEventListener('blur',()=>{keyboardMotion?.releaseAll();buttonMotion?.release();controls.enabled=mode==='orbit';requestRender();pointers.clear();gestureWasDrag=true;syncGrabCursor();renderer.domElement.style.cursor='var(--cursor-arrow)';});

const draco=new DRACOLoader().setDecoderPath('./vendor/draco/').setDecoderConfig({type:'wasm'}).setWorkerLimit(1);
const loader=new GLTFLoader().setDRACOLoader(draco);
async function load(){
  try{
    const [gltf,response]=await Promise.all([loader.loadAsync('./assets/retro-pc-web.glb'),fetch('./stats.json'),desktop.wallpaper.ready,dragCursorReady]);
    if(!response.ok)throw Error('Could not load asset statistics');
    const stats=await response.json();model=gltf.scene;
    model.traverse(o=>{
      if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
      if(o.material.name.includes('CRT glass')){
        screenMesh=o;
        const original=o.material;
        screenMaterial=new THREE.MeshPhysicalMaterial({
          name:'CRT glass',map:original.map,emissiveMap:original.emissiveMap,
          emissive:0xffffff,metalness:0,roughness:.4,
          clearcoat:0,clearcoatRoughness:.38,ior:1.5,
          specularIntensity:0,envMapIntensity:0,toneMapped:false,
          side:original.side
        });
        o.material=screenMaterial;original.dispose();
      }
      if(o.material.name.includes('Green indicator')){
        const material=o.material;
        indicatorState={material,color:material.color.clone(),emissive:material.emissive.clone(),intensity:material.emissiveIntensity};
      }
      if(o.material.name.includes('Printed legends')||o.material.name.includes('Monitor stickers')){
        o.castShadow=false;o.material.transparent=false;o.material.alphaTest=.4;
        o.material.depthWrite=true;o.material.side=THREE.DoubleSide;
        if(o.material.name.includes('Printed legends'))personalizeNameplates(o);
      }
    });
    buttonMotion=new PowerButtonMotion(model,powerSwitches,reducedMotion);
    keyboardMotion=new KeyboardMotion(model,reducedMotion);
    if(!screenMesh)throw Error('The model has no CRT screen mesh');
    scene.add(model);renderer.shadowMap.needsUpdate=true;model.updateMatrixWorld(true);screenBounds.setFromObject(screenMesh);
    setPower(false);status.classList.add('hidden');
    $('#enter-screen').disabled=false;
    window.__assetAudit={loaded:true,...stats,compressed:true};requestRender();
  }catch(error){
    console.error(error);status.textContent='The computer could not load. Please refresh the page.';
    window.__assetAudit={loaded:false,error:String(error)};
  }
}
$('#close-portfolio').addEventListener('click',closePortfolio);
$('#minimize-portfolio').addEventListener('click',minimizePortfolio);
$('#maximize-portfolio').addEventListener('click',togglePortfolioSize);
$('.portfolio-titlebar').addEventListener('dblclick',event=>{if(!event.target.closest('button'))togglePortfolioSize();});
portfolioWindow.addEventListener('cancel',event=>{event.preventDefault();closePortfolio();});
portfolioWindow.addEventListener('close',()=>{
  if(portfolioWindow.open)return;
  syncWallpaperMotion();
  focusDesktop();
});
portfolioContent.addEventListener('load',()=>{
  portfolioContent.contentDocument.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closePortfolio();}
  });
});
$('#enter-screen').addEventListener('click',()=>{buttonMotion?.press('monitor',true);requestRender();enterScreen();});
$('#back-to-pc').addEventListener('click',exitScreen);
renderer.domElement.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&mode==='desktop'){
    e.preventDefault();
    if(desktop.portfolioMinimized)openPortfolio();
    else if(desktop.folderOpen&&!desktop.minimized)desktop.openFile();
    else desktop.openFolder();
  }
  if(e.key==='Enter'&&mode==='orbit'){e.preventDefault();enterScreen();}
  if(e.key.toLowerCase()==='p'){e.preventDefault();togglePower();}
  if(e.key.toLowerCase()==='r'&&mode==='orbit'){e.preventDefault();homeView();}
});
document.addEventListener('keydown',e=>{
  if(shutdownWindow.open)return;
  if(shutdownTimer){e.preventDefault();return;}
  if(e.altKey&&e.key==='F4'&&screenLit&&!portfolioWindow.open){e.preventDefault();openShutdown();return;}
  if(portfolioWindow.open||mode==='orbit')return;
  if(e.key==='Escape'){e.preventDefault();exitScreen();}
  if(e.key==='Tab'){
    const items=[$('#back-to-pc'),...($('#touch-desktop').hidden?[renderer.domElement]:[...$('#touch-desktop').querySelectorAll('button')].filter(button=>button.getClientRects().length&&!button.disabled))];
    const i=items.indexOf(document.activeElement);
    e.preventDefault();items[(i+(e.shiftKey?-1:1)+items.length)%items.length].focus({preventScroll:true});
  }
});
renderer.domElement.addEventListener('webglcontextlost',e=>{
  e.preventDefault();status.textContent='Graphics paused. Refresh to restore the preview.';status.classList.remove('hidden');
});
// Read-only state and a screen capture support asset export and browser verification.
window.__pcExperience={
  get state(){return {mode,screenLit,shutdownDialog:shutdownWindow.open,buttons:buttonMotion?.state,keyboard:keyboardMotion?.state,portfolioRunning:desktop.portfolioRunning,portfolioMinimized:desktop.portfolioMinimized,portfolioMaximized:portfolioWindow.classList.contains('is-maximized'),folderOpen:desktop.folderOpen,minimized:desktop.minimized,startOpen:desktop.startOpen,transition:focusProgress,viewport:renderRect,camera:camera.position.toArray(),wallpaper:{type:'ascii-skull',frame:desktop.wallpaper.frame,yaw:desktop.wallpaper.yaw,samples:desktop.wallpaper.surfaceSamples}};},
  desktopPNG:()=>desktop.canvas.toDataURL('image/png'),
  desktopJPEG:()=>desktop.canvas.toDataURL('image/jpeg',.80),
  keyPoint(id=0){
    const key=keyboardMotion.keys[id];if(!key)return null;
    const point=key.center.clone();point.y=key.bounds.max.y;
    model.localToWorld(point);point.project(camera);
    const r=stage.getBoundingClientRect();
    return {x:r.left+(point.x+1)*r.width/2,y:r.top+(1-point.y)*r.height/2};
  },
  powerPoint(name='monitor'){
    const point=powerSwitches[name].getCenter(new THREE.Vector3());
    model.localToWorld(point);point.project(camera);
    const r=stage.getBoundingClientRect();
    return {x:r.left+(point.x+1)*r.width/2,y:r.top+(1-point.y)*r.height/2};
  },
  screenPoint(x,y){
    ({x,y}=desktop.displayPoint(x,y));
    const size=screenBounds.getSize(new THREE.Vector3()),r=stage.getBoundingClientRect();
    const point=new THREE.Vector3(screenBounds.min.x+x/1024*size.x,screenBounds.max.y-y/768*size.y,screenBounds.max.z).project(camera);
    return {x:r.left+(point.x+1)*r.width/2,y:r.top+(1-point.y)*r.height/2};
  }
};
homeView();resize();load();
