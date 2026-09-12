import { mkdir, copyFile, rm } from 'node:fs/promises';
const source=new URL('../../artifacts/portrait/',import.meta.url);
const output=new URL('../public/portrait/',import.meta.url);
await mkdir(output,{recursive:true});
for(const name of ['portrait.png','portrait-blink.png'])await copyFile(new URL(name,source),new URL(name,output));
// Retire only the generated game bundle; the editable game remains in artifacts/.
await rm(new URL('../public/game/',import.meta.url),{recursive:true,force:true});
console.log('Animated pixel portrait synced.');
