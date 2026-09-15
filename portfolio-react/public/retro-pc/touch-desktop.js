// A responsive version of the same desktop for narrow/touch screens. Real DOM
// controls avoid sub-10px canvas targets and WebView pointer-capture quirks.
export class TouchDesktop {
  constructor(host, desktop, { openPortfolio, openShutdown }) {
    this.desktop=desktop;
    this.media=matchMedia('(max-width: 700px), (pointer: coarse)');
    this.host=host;
    host.innerHTML=`
      <div class="touch-wallpaper" aria-hidden="true"></div>
      <button class="touch-folder" aria-label="Open portafolio folder"><img alt=""><span>portafolio</span></button>
      <section class="touch-explorer" aria-label="portafolio folder" hidden>
        <header><strong>▰ portafolio</strong><div><button data-action="minimize" aria-label="Minimize folder">_</button><button data-action="maximize" aria-label="Maximize folder" aria-pressed="false">□</button><button data-action="close" aria-label="Close folder">×</button></div></header>
        <div class="touch-address">Address <span>C:\\portafolio</span></div>
        <div class="touch-files"><button class="touch-file" aria-label="Open portafolio file"><span class="document-icon" aria-hidden="true">▤</span><span>portafolio</span></button></div>
        <footer>1 object</footer>
      </section>
      <nav class="touch-start-menu" aria-label="Start menu" hidden><strong>Windows 2000</strong><button data-action="folder">▰ portafolio</button><button data-action="shutdown">▣ Shut Down…</button></nav>
      <nav class="touch-taskbar" aria-label="Desktop taskbar"><button data-action="start" aria-expanded="false">▦ Start</button><button data-action="folder-task" hidden>▰ portafolio</button><button data-action="portfolio-task" hidden>▤ Website</button></nav>`;
    const $=s=>host.querySelector(s);
    $('.touch-folder img').src=desktop.folderSprite.toDataURL();
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
    this.host.hidden=!active;
    document.body.classList.toggle('touch-desktop-active',active);
  }
}
