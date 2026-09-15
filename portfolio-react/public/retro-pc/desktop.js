import * as THREE from 'three';
import {CrtSurface} from './crt-screen.js';
import {AsciiSkull} from './ascii-skull.js';

// A 32-pixel shell icon inspired by the supplied folder-and-picture reference.
// Every edge and dither mark lands on the pixel grid, including the tilted sheet.
function createFolderSprite(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const c=canvas.getContext('2d');
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const contains=(points,x,y)=>{
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const [a,b]=points[i],[d,e]=points[j];
      if((b>y)!==(e>y)&&x<(d-a)*(y-b)/(e-b)+a)inside=!inside;
    }
    return inside;
  };
  const poly=(points,color)=>{
    c.fillStyle=color;
    for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(contains(points,x+.5,y+.5))c.fillRect(x,y,1,1);
  };
  // Olive tab and the dark, stepped right-hand edge.
  poly([[4,6],[6,4],[13,4],[16,7],[28,7],[29,9],[30,9],[30,29],[29,30],[4,30]],'#414500');
  poly([[3,6],[5,4],[12,4],[15,7],[27,7],[28,8],[28,28],[3,28]],'#808600');
  poly([[4,7],[6,5],[12,5],[15,8],[27,8],[27,27],[4,27]],'#dfdf50');
  rect(5,6,7,1,'#ffffb4');rect(4,7,1,9,'#ffffb4');
  rect(7,7,4,1,'#bbbb36');rect(6,8,3,3,'#b9bd32');
  // A white picture sheet tilted out of the folder, with a blue globe motif.
  poly([[16,1],[32,16],[29,17],[19,28],[4,13]],'#161b22');
  poly([[16,0],[31,15],[19,27],[4,12]],'#686493');
  poly([[16,1],[30,15],[19,26],[5,12]],'#b5b4ed');
  poly([[16,2],[29,15],[19,25],[6,12]],'#e6fbff');
  poly([[16,3],[28,15],[19,24],[7,12]],'#ffffff');
  poly([[16,4],[26,14],[19,21],[9,11]],'#b9e8ff');
  poly([[16,5],[25,14],[19,20],[10,11]],'#fff');
  // Hard-edged cyan and cobalt pixels, kept readable at taskbar size.
  poly([[15,6],[18,6],[18,7],[20,7],[20,9],[21,9],[21,11],[19,11],[19,13],[15,13],[15,12],[13,12],[13,9],[14,9],[14,7],[15,7]],'#00c6f0');
  rect(15,6,2,1,'#30eaff');rect(14,8,2,2,'#61f7ff');
  rect(17,7,2,1,'#0389e7');rect(18,8,2,2,'#009ae9');
  rect(15,10,2,2,'#008cec');rect(18,11,2,2,'#0065d3');
  rect(13,11,1,1,'#1562d9');rect(11,10,1,1,'#48caf8');
  rect(9,11,1,1,'#7463dd');rect(22,11,1,1,'#b4abff');
  rect(26,14,1,2,'#8d86d6');rect(27,16,1,2,'#cbc8ff');
  // Open front, with a bright lip and warm, scattered 1990s-style dithering.
  const front=[[1,13],[25,13],[25,16],[26,16],[26,21],[27,21],[27,28],[4,28],[4,26],[3,26],[3,22],[2,22],[2,18],[1,18]];
  poly([[0,12],[25,12],[26,13],[26,16],[27,16],[27,21],[28,21],[28,29],[3,29],[3,26],[2,26],[2,22],[1,22],[1,18],[0,18]],'#999700');
  poly(front,'#ffff99');
  for(let y=14;y<28;y++)for(let x=3;x<27;x++){
    const hash=(x*37+y*61+x*y*17)%101;
    const density=12+(y-14)*1.6+(x-3)*.6;
    if(contains(front,x+.5,y+.5)&&hash<density)rect(x,y,1,1,hash%3?'#f1c477':'#ffe77c');
  }
  rect(1,13,23,1,'#ffffeb');rect(1,14,1,4,'#ffffcf');
  rect(2,18,1,4,'#ffffce');rect(3,22,1,4,'#ffffce');
  rect(4,27,23,1,'#f7ed7a');rect(4,29,24,1,'#656900');
  return canvas;
}

// Locally drawn Windows 2000-style desktop. No external icon or font downloads.
export class ClassicDesktop {
  constructor(onChange,onPowerOff,onOpenFile){
    this.canvas=document.createElement('canvas');
    this.canvas.width=1024;this.canvas.height=768;
    this.ctx=this.canvas.getContext('2d');
    this.folderSprite=createFolderSprite();
    this.wallpaper=new AsciiSkull(()=>this.draw());
    // Keep all desktop controls inside the curved CRT aperture.
    this.display={x:32,y:24,scale:.9375};
    this.crt=new CrtSurface(this.canvas,this.display);
    this.texture=new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace=THREE.SRGBColorSpace;this.texture.flipY=false;this.texture.anisotropy=4;
    this.onChange=onChange;this.onPowerOff=onPowerOff;
    this.portfolioRunning=false;this.portfolioMinimized=false;
    this.onOpenFile=onOpenFile;this.fileSelected=false;this.lastFileClick=-Infinity;
    this.folderOpen=false;this.minimized=false;this.maximized=false;
    this.startOpen=false;this.menu=null;this.showFolders=true;this.detailsView=false;
    this.selected=false;this.hovered=null;this.aboutOpen=false;
    this.draw();
  }
  rect(x,y,w,h,color){this.ctx.fillStyle=color;this.ctx.fillRect(x,y,w,h);}
  text(value,x,y,size=16,color='#111',bold=false){
    this.ctx.font=(bold?'bold ':'')+size+'px Tahoma, Arial, sans-serif';
    this.ctx.textBaseline='top';this.ctx.fillStyle=color;this.ctx.fillText(value,x,y);
  }
  line(x1,y1,x2,y2,color='#808080',width=1){
    const c=this.ctx;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();
  }
  path(points,fill,stroke=null,width=1){
    const c=this.ctx;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  bevel(x,y,w,h,pressed=false){
    this.rect(x,y,w,h,'#d4d0c8');
    const a=pressed?'#808080':'#fff',b=pressed?'#fff':'#404040';
    this.rect(x,y,w,1,a);this.rect(x,y,1,h,a);
    this.rect(x,y+h-1,w,1,b);this.rect(x+w-1,y,1,h,b);
    if(!pressed){
      this.rect(x+1,y+h-2,w-2,1,'#808080');this.rect(x+w-2,y+1,1,h-2,'#808080');
      this.rect(x+1,y+1,w-3,1,'#eeeae3');
    }
  }
  folderIcon(x,y,scale=1,muted=false){
    const c=this.ctx;c.save();c.imageSmoothingEnabled=false;
    if(muted)c.globalAlpha=.55;
    const size=Math.round(56*scale);
    c.drawImage(this.folderSprite,Math.round(x+4*scale),Math.round(y),size,size);
    c.restore();
  }
  arrow(x,y,direction='left',enabled=true){
    const c=this.ctx;c.save();c.translate(x,y);if(direction==='right'){c.translate(22,0);c.scale(-1,1);}
    this.path([[0,10],[9,1],[9,6],[22,6],[22,14],[9,14],[9,19]],enabled?'#66a84f':'#b6b7b1',enabled?'#497936':'#9f9f98');
    this.line(4,10,10,4,enabled?'#aed596':'#dfe0d9');c.restore();
  }
  windowBox(){return this.maximized?{x:6,y:6,w:1012,h:710}:{x:159,y:126,w:810,h:528};}
  openFolder(){this.folderOpen=true;this.minimized=false;this.selected=true;this.startOpen=false;this.menu=null;this.aboutOpen=false;this.draw();}
  closeFolder(){this.folderOpen=false;this.minimized=false;this.menu=null;this.aboutOpen=false;this.draw();}
  fileBox(){
    const {x,y,w}=this.windowBox(),side=this.showFolders?194:0;
    return this.detailsView?{x:x+10+side,y:y+186,w:w-20-side,h:32}:{x:x+28+side,y:y+177,w:116,h:100};
  }
  portfolioTaskBox(){return {x:this.folderOpen?373:123,y:729,w:242,h:33};}
  openFile(){if(this.folderOpen&&!this.minimized)this.onOpenFile?.();}
  control(x,y,type){
    this.bevel(x,y,25,23);
    if(type==='minimize')this.rect(x+6,y+15,12,3,'#151515');
    if(type==='maximize'){
      if(this.maximized){
        this.rect(x+8,y+5,11,9,'#222');this.rect(x+9,y+7,9,6,'#d4d0c8');
        this.rect(x+5,y+8,11,9,'#222');this.rect(x+6,y+10,9,6,'#d4d0c8');
      }else {this.rect(x+6,y+5,13,12,'#222');this.rect(x+7,y+8,11,8,'#d4d0c8');}
    }
    if(type==='close'){
      this.line(x+7,y+6,x+17,y+16,'#111',2);this.line(x+17,y+6,x+7,y+16,'#111',2);
    }
  }
  menuOptions(){
    return {
      File:[['Close','close','Alt+F4']],
      View:[[this.showFolders?'Hide details pane':'Show details pane','pane',''],[this.detailsView?'Large icons':'Details','details',''],[this.maximized?'Restore window':'Maximize window','maximize','']],
      Help:[['About portafolio','about','']]
    };
  }
  dropdown(){
    if(!this.menu)return null;
    const {x,y}=this.windowBox();
    const left={File:10,View:62,Help:122}[this.menu];
    return {x:x+left,y:y+66,w:249,h:this.menuOptions()[this.menu].length*31+8};
  }
  drawWindow(){
    const c=this.ctx,{x,y,w,h}=this.windowBox();
    this.rect(x+4,y+5,w,h,'rgba(0,0,0,.15)');
    this.bevel(x,y,w,h);
    const title=c.createLinearGradient(x,y,x+w,y);
    title.addColorStop(0,'#0a246a');title.addColorStop(1,'#6a99cf');
    c.fillStyle=title;c.fillRect(x+4,y+4,w-8,29);
    this.folderIcon(x+8,y+3,.46);this.text('portafolio',x+42,y+9,17,'#fff',true);
    ['minimize','maximize','close'].forEach((a,i)=>this.control(x+w-86+i*27,y+7,a));
    // Menu strip.
    [['File',15],['View',68],['Help',128]].forEach(([label,left])=>{
      if(this.menu===label){this.rect(x+left-5,y+37,48,27,'#0a246a');this.text(label,x+left,y+43,16,'#fff');}
      else this.text(label,x+left,y+43);
    });
    this.line(x+6,y+69,x+w-7,y+69,'#a6a39c');this.line(x+6,y+70,x+w-7,y+70,'#fff');
    // Compact classic Explorer toolbar. Navigation is visibly unavailable at this folder.
    this.arrow(x+17,y+81,'left',false);this.text('Back',x+47,y+82,16,'#898982');
    this.arrow(x+97,y+81,'right',false);
    this.line(x+135,y+77,x+135,y+105,'#aaa79f');this.line(x+136,y+77,x+136,y+105,'#fff');
    if(this.showFolders)this.bevel(x+146,y+75,107,31,true);
    this.folderIcon(x+153,y+77,.46);this.text('Folders',x+189,y+82,16);
    this.line(x+264,y+77,x+264,y+105,'#aaa79f');
    this.bevel(x+277,y+80,24,20);
    for(let r=0;r<3;r++){this.rect(x+281,y+84+r*5,3,3,'#526e96');this.rect(x+287,y+84+r*5,11,2,'#777');}
    this.text('Views',x+309,y+82,16);this.path([[353+x,88+y],[360+x,88+y],[356.5+x,92+y]],'#333');
    this.line(x+6,y+112,x+w-7,y+112,'#a6a39c');this.line(x+6,y+113,x+w-7,y+113,'#fff');
    // Recessed address field.
    this.text('Address',x+13,y+122,15,'#343434');
    this.bevel(x+82,y+117,w-96,29,true);this.rect(x+84,y+119,w-100,25,'#fff');
    this.folderIcon(x+89,y+117,.43);this.text('C:\\portafolio',x+121,y+123,15);
    this.bevel(x+w-37,y+120,21,22);this.path([[x+w-32,y+129],[x+w-23,y+129],[x+w-27.5,y+134]],'#222');
    // The contents area uses the web-view details pane familiar from this era.
    const cy=y+154,ch=h-185;
    this.bevel(x+7,cy,w-14,ch,true);
    this.rect(x+9,cy+2,w-18,ch-4,'#fff');
    const side=this.showFolders?194:0;
    if(side){
      const pane=c.createLinearGradient(x,cy,x+side,cy+ch);
      pane.addColorStop(0,'#f6f6ef');pane.addColorStop(1,'#e4e7dd');
      c.fillStyle=pane;c.fillRect(x+9,cy+2,side,ch-4);
      this.folderIcon(x+29,cy+19,.92);
      this.text('portafolio',x+28,cy+83,22,'#26384c',true);
      this.line(x+28,cy+117,x+side-10,cy+117,'#819aac');
      this.line(x+28,cy+118,x+side-10,cy+118,'#fff');
      this.text('File Folder',x+28,cy+132,15,'#394b5b');
      this.text('1 object',x+28,cy+156,14,'#717b7d');
      this.text('Details',x+28,cy+211,15,'#394b5b',true);
      this.text('Double-click portafolio',x+28,cy+239,13,'#657071');
      this.text('to open the website.',x+28,cy+258,13,'#657071');
      this.line(x+side+9,cy+2,x+side+9,cy+ch-3,'#b7c0b8');
    }
    const cx=x+10+side,cw=w-20-side;
    if(this.detailsView){
      this.rect(cx,cy+2,cw,28,'#eceae5');
      const col=[0,cw*.40,cw*.61,cw*.80];
      ['Name','Size','Type','Modified'].forEach((s,i)=>{
        this.text(s,cx+col[i]+9,cy+8,13,'#333');
        if(i)this.line(cx+col[i],cy+4,cx+col[i],cy+27,'#bbb8b0');
      });
      this.line(cx,cy+29,cx+cw,cy+29,'#b7b6af');
    }
    // A real, selectable document entry in the Explorer contents pane.
    const file=this.fileBox(),selected=this.fileSelected;
    if(selected){this.rect(file.x,file.y,file.w,file.h,'#0a246a');
      c.save();c.setLineDash([2,2]);c.strokeStyle='#fff';c.strokeRect(file.x+.5,file.y+.5,file.w-1,file.h-1);c.restore();}
    const ix=file.x+(this.detailsView?9:39),iy=file.y+8;
    const size=this.detailsView?18:38;
    this.rect(ix+2,iy+2,size,size+7,'#777');this.rect(ix,iy,size,size+7,'#fff');
    this.rect(ix+4,iy+5,size-8,6,'#0a246a');
    for(let i=0;i<3;i++)this.rect(ix+4,iy+16+i*5,size-8,2,'#819aac');
    this.text('portafolio',this.detailsView?ix+29:file.x+22,this.detailsView?file.y+8:iy+57,15,selected?'#fff':'#111');
    if(this.detailsView)this.text('HTML document',file.x+cw*.61+9,file.y+8,12,selected?'#fff':'#555');
    // Segmented status strip with resize grip.
    this.bevel(x+7,y+h-25,w-225,19,true);
    this.bevel(x+w-215,y+h-25,76,19,true);
    this.bevel(x+w-136,y+h-25,128,19,true);
    this.text('1 object',x+15,y+h-22,12,'#363636');
    this.text('Website',x+w-206,y+h-22,12,'#575757');
    this.text('My Computer',x+w-124,y+h-22,12,'#444');
    for(let i=0;i<3;i++)this.line(x+w-8-i*4,y+h-8,x+w-8,y+h-8-i*4,'#777');
    const menu=this.dropdown();
    if(menu){
      this.rect(menu.x+3,menu.y+3,menu.w,menu.h,'rgba(0,0,0,.18)');
      this.bevel(menu.x,menu.y,menu.w,menu.h);
      this.menuOptions()[this.menu].forEach(([label,action,shortcut],i)=>{
        const active=this.hovered==='menu-'+action;
        if(active)this.rect(menu.x+3,menu.y+4+i*31,menu.w-6,30,'#0a246a');
        this.text(label,menu.x+16,menu.y+11+i*31,15,active?'#fff':'#111');
        if(shortcut)this.text(shortcut,menu.x+174,menu.y+11+i*31,13,active?'#fff':'#555');
      });
    }
    if(this.aboutOpen)this.drawAbout();
  }
  drawAbout(){
    const x=308,y=274,w=408,h=206;
    this.bevel(x,y,w,h);this.rect(x+4,y+4,w-8,28,'#0a246a');
    this.text('About portafolio',x+11,y+9,16,'#fff',true);this.control(x+w-31,y+7,'close');
    this.folderIcon(x+22,y+54,.95);this.text('portafolio',x+103,y+61,22,'#222',true);
    this.text('Your personal folder.',x+104,y+94,15,'#555');
    this.text('Ready for your work.',x+104,y+117,15,'#555');
    this.bevel(x+w-104,y+h-43,86,28);this.text('OK',x+w-72,y+h-36,15);
  }
  animateWallpaper(time){this.wallpaper.update(time);this.draw(false);}
  draw(notify=true){
    const c=this.ctx,{x,y,scale}=this.display;
    c.clearRect(0,0,1024,768);this.rect(0,0,1024,768,'#111918');
    c.save();c.translate(x,y);c.scale(scale,scale);
    this.rect(0,0,1024,768,'#3a6ea5');
    this.wallpaper.draw(c);
    const selected=this.selected||this.hovered==='folder';
    if(selected){
      this.rect(31,30,87,79,'rgba(174,211,255,.10)');
      c.save();c.setLineDash([2,2]);c.strokeStyle='rgba(233,243,255,.65)';c.lineWidth=1;c.strokeRect(31.5,30.5,86,78);c.restore();
    }
    this.folderIcon(43,34,1.03);
    if(selected)this.rect(28,95,94,25,'#0a246a');
    else this.text('portafolio',35,101,17,'rgba(0,0,0,.5)');
    this.text('portafolio',34,100,17,'#fff');
    if(this.folderOpen&&!this.minimized)this.drawWindow();
    this.rect(0,723,1024,45,'#d4d0c8');this.rect(0,723,1024,1,'#fff');
    this.bevel(7,729,95,33,this.startOpen);
    [[0,0,'#df5541'],[11,0,'#6b9e45'],[0,11,'#3d67bd'],[11,11,'#f0ca4b']].forEach(([dx,dy,col])=>this.rect(15+dx,736+dy,9,9,col));
    this.text('Start',43,736,18,'#111',true);
    this.rect(110,732,1,27,'#888');this.rect(112,732,1,27,'#fff');
    if(this.folderOpen){
      this.bevel(123,729,242,33,!this.minimized);
      this.folderIcon(131,730,.45);this.text('portafolio',166,738,15,'#111',!this.minimized);
    }
    if(this.portfolioRunning){
      const b=this.portfolioTaskBox();
      this.bevel(b.x,b.y,b.w,b.h,!this.portfolioMinimized);
      this.rect(b.x+10,b.y+7,16,20,'#fff');this.rect(b.x+12,b.y+10,12,4,'#0a246a');
      this.text('portafolio — Website',b.x+34,b.y+9,14,'#111',!this.portfolioMinimized);
    }
    this.bevel(901,729,117,33,true);
    this.rect(913,740,5,10,'#6b6b68');this.path([[918,740],[923,736],[923,754],[918,750]],'#6b6b68');
    this.text('12:00 PM',932,739,14);
    if(this.startOpen){
      this.bevel(5,507,265,216);
      const g=c.createLinearGradient(0,507,0,723);g.addColorStop(0,'#3267ad');g.addColorStop(1,'#0a246a');
      c.fillStyle=g;c.fillRect(9,511,37,208);
      c.save();c.translate(18,704);c.rotate(-Math.PI/2);this.text('Windows 2000',0,0,23,'#fff',true);c.restore();
      if(this.hovered==='folder')this.rect(48,515,218,65,'#0a246a');
      this.folderIcon(60,519,.7);this.text('portafolio',111,536,17,this.hovered==='folder'?'#fff':'#111');
      this.line(55,588,260,588,'#aaa79f');this.line(55,589,260,589,'#fff');
      this.text('Personal desktop',64,608,14,'#666');
      if(this.hovered==='shutdown')this.rect(48,662,218,53,'#0a246a');
      this.bevel(62,674,25,20);this.rect(65,677,19,13,'#203c5d');
      this.rect(72,694,5,4,'#777');this.rect(66,698,18,3,'#444');
      this.path([[83,682],[90,677],[90,681],[97,681],[97,686],[90,686],[90,690]],'#a63e35','#6e2924');
      this.text('Shut Down...',111,679,16,this.hovered==='shutdown'?'#fff':'#111');
    }
    c.restore();
    this.crt.apply();
    this.texture.needsUpdate=true;
    if(notify)this.onChange?.({folderOpen:this.folderOpen,minimized:this.minimized,startOpen:this.startOpen});
  }
  displayPoint(x,y){return {x:this.display.x+x*this.display.scale,y:this.display.y+y*this.display.scale};}
  hit(x,y){
    x=(x-this.display.x)/this.display.scale;y=(y-this.display.y)/this.display.scale;
    if(x<0||x>1024||y<0||y>768)return 'glass';
    const inside=(l,t,w,h)=>x>=l&&x<=l+w&&y>=t&&y<=t+h;
    if(inside(7,729,95,33))return 'start';
    if(this.startOpen){
      if(inside(48,515,218,65))return 'folder';
      if(inside(48,662,218,53))return 'shutdown';
      return 'dismiss-start';
    }
    const task=this.portfolioTaskBox();
    if(this.portfolioRunning&&inside(task.x,task.y,task.w,task.h))return 'portfolio-task';
    if(this.folderOpen&&inside(123,729,242,33))return 'task';
    if(this.folderOpen&&!this.minimized){
      if(this.aboutOpen){
        if(inside(685,281,25,23)||inside(612,437,86,28))return 'about-close';
        return 'window';
      }
      const menu=this.dropdown();
      if(menu&&inside(menu.x,menu.y,menu.w,menu.h)){
        const item=this.menuOptions()[this.menu][Math.floor((y-menu.y-4)/31)];
        return item?'menu-'+item[1]:'window';
      }
      const b=this.windowBox(),u=x-b.x,v=y-b.y;
      if(v>=7&&v<=30){
        if(u>=b.w-32&&u<=b.w-7)return 'close';
        if(u>=b.w-59&&u<b.w-34)return 'maximize';
        if(u>=b.w-86&&u<b.w-61)return 'minimize';
      }
      if(v>=36&&v<=65){if(u>=10&&u<61)return 'File';if(u>=62&&u<119)return 'View';if(u>=122&&u<178)return 'Help';}
      if(v>=75&&v<=106){if(u>=146&&u<=253)return 'pane';if(u>=276&&u<=366)return 'views';}
      const file=this.fileBox();
      if(inside(file.x,file.y,file.w,file.h))return 'portfolio-file';
      if(inside(b.x,b.y,b.w,b.h))return 'window';
    }
    return inside(26,28,99,97)?'folder':'desktop';
  }
  hover(x,y){
    const next=x==null?null:this.hit(x,y);
    if(this.hovered===next)return;
    this.hovered=next;this.draw();
  }
  click(x,y){
    let hit=this.hit(x,y);
    if(hit==='glass')return;
    if(hit==='portfolio-task')return this.onOpenFile?.();
    if(hit==='folder')return this.openFolder();
    if(hit==='portfolio-file'){
      const now=performance.now(),doubleClick=this.fileSelected&&now-this.lastFileClick<500;
      this.fileSelected=true;this.lastFileClick=now;this.draw();
      if(doubleClick){this.lastFileClick=-Infinity;this.openFile();}return;
    }
    this.lastFileClick=-Infinity;
    if(hit==='window')this.fileSelected=false;
    if(hit==='shutdown'){this.startOpen=false;this.draw();this.onPowerOff?.();return;}
    if(hit.startsWith('menu-')){hit=hit.slice(5);this.menu=null;}
    if(hit==='start'){this.startOpen=!this.startOpen;this.menu=null;}
    else if(hit==='dismiss-start')this.startOpen=false;
    else if(hit==='close')return this.closeFolder();
    else if(hit==='minimize'){this.minimized=true;this.menu=null;}
    else if(hit==='maximize'){this.maximized=!this.maximized;this.menu=null;}
    else if(hit==='task'){this.minimized=!this.minimized;this.menu=null;}
    else if(hit==='pane'){this.showFolders=!this.showFolders;this.menu=null;}
    else if(hit==='details'){this.detailsView=!this.detailsView;this.menu=null;}
    else if(hit==='views')this.menu=this.menu==='View'?null:'View';
    else if(hit==='about'){this.aboutOpen=true;this.menu=null;}
    else if(hit==='about-close')this.aboutOpen=false;
    else if(['File','View','Help'].includes(hit))this.menu=this.menu===hit?null:hit;
    else {this.menu=null;if(hit==='desktop')this.selected=false;}
    this.draw();
  }
}
