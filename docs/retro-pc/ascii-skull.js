// ASCII samples baked in Blender from Vladimir Petkovic's CC0 skull.
// Only the compressed lighting grid ships; the source mesh stays out of the website.
const ramp='.,:;i1tfLCG08@';
const dither=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
export class AsciiSkull {
  constructor(onReady){
    this.canvas=document.createElement('canvas');this.canvas.width=672;this.canvas.height=688;
    this.ctx=this.canvas.getContext('2d');this.elapsed=0;this.lastTime=0;this.frame=0;this.yaw=-.18;this.surfaceSamples=0;
    this.cols=112;this.rows=86;this.cellX=6;this.cellY=8;this.poseIndex=-1;
    this.ready=this.load().then(()=>{this.render();onReady?.();});
  }
  async load(){
    const response=await fetch(new URL('./assets/skull-ascii.bin.gz',import.meta.url));
    if(!response.ok)throw Error('Could not load the ASCII skull');
    const packed=await response.arrayBuffer();
    const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'));
    const buffer=await new Response(stream).arrayBuffer();
    const bytes=new Uint8Array(buffer),view=new DataView(buffer),decoder=new TextDecoder();
    if(decoder.decode(bytes.subarray(0,4))!=='SKA1')throw Error('Invalid ASCII skull data');
    const length=view.getUint32(4,true);this.metadata=JSON.parse(decoder.decode(bytes.subarray(8,8+length)));
    this.cols=this.metadata.cols;this.rows=this.metadata.rows;
    this.canvas.width=this.cols*this.cellX;this.canvas.height=this.rows*this.cellY;
    this.samples=bytes.subarray(8+length);
    const stride=this.cols*this.rows;
    if(this.samples.length!==stride*this.metadata.yaws.length)throw Error('Incomplete ASCII skull data');
    if(this.metadata.delta)for(let i=stride;i<this.samples.length;i++)this.samples[i]^=this.samples[i-stride];
    if(this.metadata.levels)for(let i=0;i<this.samples.length;i++)this.samples[i]=Math.round(this.samples[i]*255/(this.metadata.levels-1));
  }
  update(time){
    if(this.lastTime)this.elapsed+=Math.min(.3,(time-this.lastTime)/1000);
    this.lastTime=time;this.yaw=-.196+Math.sin(this.elapsed*.27)*.384;
    this.render();this.frame++;
  }
  render(){
    if(!this.metadata)return;
    const angles=this.metadata.yaws;
    let pose=0;for(let i=1;i<angles.length;i++)if(Math.abs(angles[i]-this.yaw)<Math.abs(angles[pose]-this.yaw))pose=i;
    if(pose===this.poseIndex)return;this.poseIndex=pose;this.surfaceSamples=this.metadata.samples[pose];
    const offset=pose*this.cols*this.rows,c=this.ctx;c.clearRect(0,0,this.canvas.width,this.canvas.height);
    c.font='10px Consolas, "Courier New", monospace';c.textBaseline='middle';c.textAlign='center';
    for(let level=0;level<16;level++){
      const t=level/15;
      c.fillStyle=`rgb(${Math.round(15+t*224)},${Math.round(35+t*207)},${Math.round(48+t*171)})`;
      for(let row=0;row<this.rows;row++)for(let col=0;col<this.cols;col++){
        const raw=this.samples[offset+row*this.cols+col];if(!raw)continue;
        const linear=raw/255;
        const value=linear<.18?linear*.75:.35+.65*Math.pow((linear-.18)/.82,.72);
        if(Math.min(15,Math.floor(value*16))!==level)continue;
        const density=value*(ramp.length-1),threshold=dither[(row%4)*4+col%4]/16;
        const index=Math.min(ramp.length-1,Math.floor(density)+(density%1>threshold?1:0));
        const glyph=value<.17?'#':ramp[index];
        c.fillText(glyph,col*this.cellX+3,row*this.cellY+4);
      }
    }
  }
  draw(ctx){ctx.drawImage(this.canvas,(1024-this.canvas.width)/2,22);}
}
