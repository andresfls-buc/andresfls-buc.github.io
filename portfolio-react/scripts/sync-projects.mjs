import { readFile, writeFile, mkdir } from 'node:fs/promises';
const profile='https://github.com/andresfls-buc';
let html;
if(process.argv[2]==='--file')html=await readFile(process.argv[3],'utf8');
else {const response=await fetch(profile,{signal:AbortSignal.timeout(20000),headers:{'Accept-Language':'en'}});if(!response.ok)throw Error(`GitHub returned ${response.status}`);html=await response.text();}
const section=html.match(/js-pinned-items-reorder-container[\s\S]*?<\/ol>/)?.[0];
if(!section||!/<h2[^>]*>\s*Pinned\b/.test(section))throw Error('No pinned repository section found. Existing projects were preserved.');
const decode=text=>text.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).trim();
const repos=[...section.matchAll(/<li\b[\s\S]*?<\/li>/g)].map(([item])=>{
 const link=item.match(/href="(\/[^"/]+\/[^"/]+)"[^>]*><span class="repo">([^<]+)<\/span>/);
 if(!link)throw Error('A pinned item could not be parsed. Existing projects were preserved.');
 const count=suffix=>{const value=item.match(new RegExp('href="[^" ]+/'+suffix+'"[\\s\\S]*?</a>'))?.[0];return value?decode(value.slice(value.indexOf('>')+1)).replace(/\s/g,''):'0';};
 return {id:link[1],name:decode(link[2]),html_url:'https://github.com'+link[1],description:decode(item.match(/<p class="pinned-item-desc[^>]*>([\s\S]*?)<\/p>/)?.[1]||''),language:decode(item.match(/itemprop="programmingLanguage">([^<]+)/)?.[1]||''),stargazers_count:count('stargazers'),forks_count:count('forks')};
});
if(!repos.length||repos.length>6)throw Error('Unexpected pinned project count. Existing projects were preserved.');
const output=new URL('../src/data/pinned-projects.json',import.meta.url);await mkdir(new URL('.',output),{recursive:true});
await writeFile(output,JSON.stringify(repos,null,2)+'\n');console.log('Pinned projects: '+repos.map(r=>r.name).join(', '));
