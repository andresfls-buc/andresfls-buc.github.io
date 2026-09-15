// A responsive version of the same desktop for narrow/touch screens. Real DOM
// controls avoid sub-10px canvas targets and WebView pointer-capture quirks.
export class TouchDesktop {
  constructor(host, desktop, { openPortfolio, openShutdown }) {
    this.desktop=desktop;
    this.media=matchMedia('(max-width: 700px), (pointer: coarse)');
    this.host=host;
    const svgImage=body=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${body}</svg>`);
    const icons={
      folder:desktop.folderSprite.toDataURL(),
      file:svgImage('<path d="M7 2h14l6 6v23H7z" fill="#777"/><path d="M5 1h15l6 6v22H5z" fill="#fff" stroke="#444"/><path d="M20 1v7h6" fill="#d4d0c8" stroke="#666"/><path fill="#0a246a" d="M8 10h15v5H8z"/><path stroke="#718da8" stroke-width="2" d="M8 19h15M8 23h15"/>'),
      windows:svgImage('<path d="M2 4l12-2v12H2z" fill="#df5541"/><path d="M17 2l13 2v10H17z" fill="#6b9e45"/><path d="M2 17h12v13L2 27z" fill="#3d67bd"/><path d="M17 17h13v10l-13 3z" fill="#f0ca4b"/>'),
      shutdown:svgImage('<path fill="#d4d0c8" stroke="#444" d="M2 4h24v18H2z"/><path fill="#24456b" d="M5 7h18v12H5z"/><path fill="#777" d="M11 23h7v4H7v3h17v-3h-6v-4z"/><path fill="#ac3f35" stroke="#712b24" d="M21 14l7-5v4h4v6h-4v4l-7-5z"/>'),
      speaker:svgImage('<path fill="#656560" d="M2 12h7l9-7v22l-9-7H2z"/><path fill="none" stroke="#656560" stroke-width="2" d="M22 10q7 6 0 12M26 5q12 11 0 22"/>')
    };
    const icon=name=>`<img class="desktop-icon" src="${icons[name]}" alt="" draggable="false">`;
    this.icons=icons;
    host.innerHTML=`
      <div class="touch-wallpaper" aria-hidden="true"></div>
      <button class="touch-folder" aria-label="Open portafolio folder">${icon("folder")}<span>portafolio</span></button>
      <section class="touch-explorer" aria-label="portafolio folder" hidden>
        <header><strong>${icon("folder")}<span>portafolio</span></strong><div><button data-action="minimize" aria-label="Minimize folder">_</button><button data-action="maximize" aria-label="Maximize folder" aria-pressed="false">□</button><button data-action="close" aria-label="Close folder">×</button></div></header>
        <div class="touch-address">Address <span>${icon("folder")}C:\\portafolio</span></div>
        <div class="touch-files"><button class="touch-file" aria-label="Open portafolio file">${icon("file")}<span>portafolio</span></button></div>
        <footer>1 object</footer>
      </section>
      <nav class="touch-start-menu" aria-label="Start menu" hidden><strong>${icon("windows")}Windows 2000</strong><button data-action="folder">${icon("folder")}<span>portafolio</span></button><button data-action="shutdown">${icon("shutdown")}<span>Shut Down…</span></button></nav>
      <nav class="touch-taskbar" aria-label="Desktop taskbar"><button data-action="start" aria-expanded="false">${icon("windows")}<span>Start</span></button><button data-action="folder-task" hidden>${icon("folder")}<span>portafolio</span></button><button data-action="portfolio-task" hidden>${icon("file")}<span>portafolio</span></button><div class="touch-tray">${icon("speaker")}<time>12:00</time></div></nav>`;
    const $=s=>host.querySelector(s);
    document.querySelector('#portfolio-title').innerHTML=icon('file')+'<span>portafolio — Andrés Landazábal</span>';
    const clock=$('.touch-tray time');
    clock.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false});
    $('.touch-wallpaper').append(desktop.wallpaper.canvas);
    $('.touch-folder').onclick=()=>desktop.openFolder();
    $('.touch-file').onclick=openPortfolio;
    $('[data-action="folder"]').onclick=()=>desktop.openFolder();
    $('[data-action="shutdown"]').onclick=openShutdown;
    $('[data-action="start"]').onclick=()=>{desktop.startOpen=!desktop.startOpen;desktop.draw();};
    $('[data-action="folder-task"]').onclick=()=>{desktop.minimized=!desktop.minimized;desktop.draw();};
    $('[data-action="portfolio-task"]').onclick=openPortfolio;
    $('[data-action="close"]').onclick=()=>desktop.closeFolder();
    $('[data-action="minimize"]').onclick=()=>{desktop.minimized=true;desktop.draw();};
    $('[data-action="maximize"]').onclick=()=>{desktop.maximized=!desktop.maximized;desktop.draw();};
    host.addEventListener('click',event=>{if(event.target===host&&desktop.startOpen){desktop.startOpen=false;desktop.draw();}});
    this.sync();
  }
  sync(){
    const d=this.desktop,$=s=>this.host.querySelector(s);
    $('.touch-explorer').hidden=!d.folderOpen||d.minimized;
    $('.touch-explorer').classList.toggle('is-maximized',d.maximized);
    $('[data-action="maximize"]').setAttribute('aria-pressed',String(d.maximized));
    $('[data-action="maximize"]').setAttribute('aria-label',d.maximized?'Restore folder size':'Maximize folder');
    $('.touch-start-menu').hidden=!d.startOpen;
    $('[data-action="start"]').setAttribute('aria-expanded',String(d.startOpen));
    $('[data-action="folder-task"]').hidden=!d.folderOpen;
    $('[data-action="folder-task"]').setAttribute('aria-pressed',String(!d.minimized));
    $('[data-action="portfolio-task"]').hidden=!d.portfolioRunning;
    $('[data-action="portfolio-task"]').setAttribute('aria-pressed',String(!d.portfolioMinimized));
  }
  setMode(mode){
    const active=this.media.matches&&mode==='desktop';
    const transitioning=this.media.matches&&(mode==='entering'||mode==='leaving');
    this.host.hidden=!(active||transitioning);
    this.host.style.pointerEvents=active?'':'none';
    document.body.classList.toggle('touch-desktop-active',active);
    if(!transitioning)this.blend(active?1:0);
  }
  blend(progress){
    // Fade during the camera movement, never swap views after it finishes.
    const t=Math.max(0,Math.min(1,(progress-.3)/.6));
    const alpha=this.media.matches?t*t*(3-2*t):0;
    this.host.style.opacity=String(alpha);
    document.querySelector('#stage').style.opacity=String(1-alpha);
  }
}
