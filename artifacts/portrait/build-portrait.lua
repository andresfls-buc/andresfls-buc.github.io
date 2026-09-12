-- Illustrated likeness, finished as an exact 64 × 64, sixteen-colour sprite.
local W,H=64,64
local reference=app.open(OUT..'/sprite-reference.png')
local source=Image(reference.width,reference.height,ColorMode.RGB);source:drawSprite(reference,1);reference:close()
local pc=app.pixelColor
local hex={'231b19','4e3428','80593e','b28557','e2b278','b66941','dc945e','f0b37b','ffce98','8e4c35','5a3529','f6f1e5','c5c4c4','8a9093','456650','283f33'}
local palette={}
local function color(h)return pc.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255)end
for _,h in ipairs(hex)do palette[#palette+1]=color(h)end
local function nearest(c)
 local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c);local best,dist=palette[1],1e12
 for _,v in ipairs(palette)do local d=(r-pc.rgbaR(v))^2*.3+(g-pc.rgbaG(v))^2*.5+(b-pc.rgbaB(v))^2*.2;if d<dist then best=v;dist=d end end
 return best
end
local base=Image(W,H,ColorMode.RGB)
for y=0,H-1 do for x=0,W-1 do base:drawPixel(x,y,nearest(source:getPixel(math.floor((x+.5)/W*source.width),math.floor((y+.5)/H*source.height))))end end
local s=Sprite(W,H,ColorMode.RGB);local body=s.layers[1];body.name='Portrait · 16 colour sprite'
local lids=s:newLayer();lids.name='Hand-drawn blinking eyes'
local frames={{0,3000},{.5,55},{1,45},{1,90},{.5,45},{0,55},{0,1600},{.5,50},{1,80},{0,50}}
for f,v in ipairs(frames)do
 if f>1 then s:newEmptyFrame()end;s.frames[f].duration=v[2]/1000;s:newCel(body,f,base,Point(0,0))
 local im=Image(W,H,ColorMode.RGB)
 if v[1]>0 then
  for _,eye in ipairs({{21,28,22,25},{35,41,21,24}})do
   local x1,x2,top,bottom=table.unpack(eye)
   local edge=v[1]==1 and bottom or top+1
   for x=x1,x2 do
    for y=top,edge do im:drawPixel(x,y,color(y==top and 'f0b37b' or 'dc945e'))end
    if x>x1 and x<x2 then im:drawPixel(x,edge,color('4e3428'))end
   end
  end
 end
 s:newCel(lids,f,im,Point(0,0))
end
local tag=s:newTag(1,#frames);tag.name='Blink'
s:saveAs(OUT..'/andres-pixel-sprite.aseprite')
local still=Sprite(W,H,ColorMode.RGB);still:newCel(still.layers[1],1,base,Point(0,0));still:saveAs(OUT..'/portrait.png');still:close()
local sheet=Sprite(W*#frames,H,ColorMode.RGB);local row=Image(W*#frames,H,ColorMode.RGB)
for f=1,#frames do local frame=Image(W,H,ColorMode.RGB);frame:drawSprite(s,f);row:drawImage(frame,Point((f-1)*W,0))end
sheet:newCel(sheet.layers[1],1,row,Point(0,0));sheet:saveAs(OUT..'/portrait-blink.png');sheet:close()
s:resize(384,384);s:saveAs(OUT..'/portrait.gif')
print('Portrait sprite: 64 × 64, sixteen colours, ten blink frames.')
