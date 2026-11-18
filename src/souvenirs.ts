import runwayUrl from './assets/runway.webp';
import watermarkUrl from './assets/postcard-watermark.webp';
import { arrivalCopy } from './arrival-copy';
import type { Language } from './copy';
export type SouvenirData = { name: string; phrase: string; language: Language };

function paragraph(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, size: number, color='#203c43', italic=false) {
  ctx.font=`${italic?'italic ':''}${size}px "PT Serif", Georgia, serif`; ctx.fillStyle=color;
  let line='';
  for(const word of text.split(/\s+/)) {
    const candidate=line ? `${line} ${word}` : word;
    if(line && ctx.measureText(candidate).width>width) {ctx.fillText(line,x,y,width);y+=size*1.5;line=word;}
    else line=candidate;
  }
  if(line)ctx.fillText(line,x,y,width);
  return y+size*1.5;
}
function seal(ctx: CanvasRenderingContext2D, label: string, x:number,y:number,r:number,rotation:number) {
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.strokeStyle='#964e39';ctx.fillStyle='#964e39';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r-7,0,Math.PI*2);ctx.stroke();
  ctx.textAlign='center';ctx.font='bold 17px "PT Serif", Georgia, serif';ctx.fillText(label,0,-3,r*1.7);ctx.font='13px monospace';ctx.fillText('30 · 11 · 2026',0,22,r*1.7);ctx.restore();
}
let artPromise:Promise<HTMLImageElement>|undefined;
function getArt(){return artPromise??=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.src=watermarkUrl;image.decode().then(()=>resolve(image),()=>{artPromise=undefined;reject(new Error('art'));});});}
function postage(ctx:CanvasRenderingContext2D,art:HTMLImageElement,x:number,y:number,country:'AR'|'FR'){
  const width=108,height=134;ctx.save();ctx.translate(x,y);ctx.rotate(country==='AR'?-.07:.08);
  ctx.fillStyle='#fff4d8';ctx.strokeStyle='#927956';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,0);
  for(let i=0;i<width;i+=8){ctx.lineTo(i+4,3);ctx.lineTo(i+8,0);}for(let i=0;i<height;i+=8){ctx.lineTo(width-3,i+4);ctx.lineTo(width,i+8);}for(let i=width;i>0;i-=8){ctx.lineTo(i-4,height-3);ctx.lineTo(i-8,height);}for(let i=height;i>0;i-=8){ctx.lineTo(3,i-4);ctx.lineTo(0,i-8);}ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=country==='AR'?'#d9e9e4':'#e4e0d0';ctx.fillRect(8,9,92,81);
  const crop=country==='AR'?0:art.width*.55;ctx.drawImage(art,crop,0,art.width*.45,art.height,8,11,92,78);
  ctx.fillStyle='#436361';ctx.font='10px monospace';ctx.fillText(country==='AR'?'ARGENTINA · AR':'FRANCE · FR',9,105,90);
  ctx.font='bold 12px "PT Serif", Georgia, serif';ctx.fillText(country==='AR'?'SALTA':'PARIS',9,122);
  if(country==='AR'){ctx.fillStyle='#80b5d0';ctx.fillRect(76,111,23,13);ctx.fillStyle='#fffaf0';ctx.fillRect(76,115,23,5);ctx.fillStyle='#d3af55';ctx.beginPath();ctx.arc(87.5,117.5,1.5,0,Math.PI*2);ctx.fill();}
  else {for(const [i,color] of ['#365784','#fffaf0','#b2675e'].entries()){ctx.fillStyle=color;ctx.fillRect(76+i*7.6,111,7.6,13);}}
  ctx.restore();
}
export async function createSouvenir(kind:'passport'|'postcard',data:SouvenirData):Promise<Blob> {
  await document.fonts.ready;
  const words=arrivalCopy[data.language];
  const canvas=document.createElement('canvas');canvas.width=kind==='postcard'?1200:800;canvas.height=kind==='postcard'?800:1100;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');
  ctx.fillStyle='#f3e8cd';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#9573440b';ctx.lineWidth=1;for(let y=0;y<canvas.height;y+=5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
  if(kind==='postcard') {
    const photo=new Image();photo.src=runwayUrl;await photo.decode();
    const scale=Math.max(470/photo.width,800/photo.height);
    const cropWidth=470/scale,cropHeight=800/scale;
    ctx.drawImage(photo,(photo.width-cropWidth)/2,(photo.height-cropHeight)/2,cropWidth,cropHeight,0,0,470,800);
    ctx.fillStyle='#132a36';ctx.fillRect(470,0,9,800);
    const art=await getArt();ctx.save();ctx.globalAlpha=.19;ctx.drawImage(art,495,400,700,292);ctx.translate(850,492);ctx.rotate(-.09);ctx.fillStyle='#5b766b';ctx.font='italic 40px "PT Serif", Georgia, serif';ctx.fillText('Salta — Paris',-210,0);ctx.restore();
    ctx.fillStyle='#98733e';ctx.font='16px monospace';ctx.fillText('VOYAGEURS · FR 101',525,74);
    let y=paragraph(ctx,words.postcardTitle,525,143,605,39);
    ctx.font='24px "PT Serif", Georgia, serif';ctx.fillStyle='#203c43';ctx.fillText(data.name||words.unnamed,525,y+22,605);
    y=paragraph(ctx,`“${data.phrase}”`,525,y+88,585,27,'#305b60',true);
    postage(ctx,art,533,548,'AR');postage(ctx,art,669,552,'FR');
    seal(ctx,words.seal,1015,615,88,-.13);
    ctx.font='14px monospace';ctx.fillStyle='#735f44';ctx.fillText(words.date,525,755);
  } else {
    ctx.fillStyle='#12283b';ctx.fillRect(0,0,800,35);ctx.fillRect(0,1065,800,35);
    ctx.strokeStyle='#b18d50';ctx.lineWidth=2;ctx.strokeRect(35,35,730,1030);
    ctx.fillStyle='#98733e';ctx.font='17px monospace';ctx.fillText('FR 101 · VOYAGEURS',65,91);
    paragraph(ctx,words.passportTitle,65,160,670,43);
    ctx.font='21px "PT Serif", Georgia, serif';ctx.fillText('4e année · Pratique IV · 2026',65,225);
    ctx.fillText('Professorat de Français',65,260);
    ctx.strokeStyle='#bba77c';ctx.beginPath();ctx.moveTo(65,294);ctx.lineTo(735,294);ctx.stroke();
    ctx.font='32px "PT Serif", Georgia, serif';ctx.fillStyle='#203c43';ctx.fillText(data.name||words.unnamed,65,359,670);
    seal(ctx,words.boarding,205,510,100,-.13);seal(ctx,words.teaching,590,510,100,.1);
    ctx.fillStyle='#98733e';ctx.font='14px monospace';ctx.fillText(words.takeaway.toUpperCase(),65,690);
    paragraph(ctx,`“${data.phrase}”`,65,737,670,28,'#305b60',true);
    seal(ctx,words.arrivalStamp,570,912,91,-.12);
    ctx.font='12px monospace';ctx.fillStyle='#73634d';ctx.fillText(words.specimen,65,1028,670);
  }
  return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('export')),'image/png'));
}
