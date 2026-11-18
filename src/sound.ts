import type { Language } from './copy';
type Cue = 'tap'|'paper'|'stamp'|'flight'|'landing'|'success'|'error'|'finish';
let context:AudioContext|undefined, muted=false, language:Language='ar';
let noise:AudioBuffer|undefined;
const key='voyageurs-sound-muted';
try {muted=localStorage.getItem(key)==='true';} catch {/* Keep the in-memory preference. */}
function audioContext() {
  if(!context) {
    const Constructor=window.AudioContext ?? (window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
    if(Constructor)context=new Constructor();
  }
  return context;
}
function tone(ctx:AudioContext,freq:number,start:number,duration:number,volume:number,end=freq) {
  const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(freq,start);oscillator.frequency.exponentialRampToValueAtTime(end,start+duration);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  oscillator.connect(gain).connect(ctx.destination);oscillator.start(start);oscillator.stop(start+duration+.02);
}
function air(ctx:AudioContext,start:number,duration:number,volume:number,frequency:number) {
  if(!noise){noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.setValueAtTime(frequency,start);filter.frequency.exponentialRampToValueAtTime(frequency/3,start+duration);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+Math.min(.3,duration/4));gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  source.connect(filter).connect(gain).connect(ctx.destination);source.start(start);source.stop(start+duration);
}
export function sound(cue:Cue) {
  if(muted || document.hidden || !context || context.state!=='running')return;
  const t=context.currentTime;
  if(cue==='tap')tone(context,740,t,.055,.025,510);
  if(cue==='paper')air(context,t,.35,.075,1900);
  if(cue==='stamp'){air(context,t,.16,.16,450);tone(context,110,t,.18,.09,65);}
  if(cue==='flight'||cue==='landing')air(context,t,cue==='flight'?5:3.8,.11,900);
  if(cue==='error')tone(context,240,t,.16,.035,190);
  if(cue==='success'||cue==='finish'){tone(context,440,t,.4,.04);tone(context,554,t+.12,.4,.035);tone(context,660,t+.24,.7,.03);}
}
function render() {
  const button=document.querySelector<HTMLButtonElement>('#sound-toggle');if(!button)return;
  button.setAttribute('aria-pressed',String(muted));
  button.setAttribute('aria-label',language==='ar'?(muted?'Activar sonidos':'Silenciar sonidos'):(muted?'Activer les sons':'Couper les sons'));
  for(const audio of document.querySelectorAll('audio'))audio.muted=muted;
}
export function translateSound(lang:Language){language=lang;render();}
export function initSound() {
  render();
  const unlock=()=>{if(muted)return;try {const ctx=audioContext();if(ctx?.state==='suspended')void ctx.resume().catch(()=>{});}catch{/* Sound is optional on unsupported browsers. */}};
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  document.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')unlock();},{capture:true});
  document.querySelector('#sound-toggle')?.addEventListener('click',()=>{
    muted=!muted;try{localStorage.setItem(key,String(muted));}catch{/* Retain this visit's choice. */}
    if(muted){void context?.suspend();}else{unlock();}
    render();
  });
  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target.closest('button,summary,input[type="radio"]'):null;
    if(target && target.id!=='sound-toggle' && !target.hasAttribute('disabled'))sound('tap');
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){void context?.suspend();for(const audio of document.querySelectorAll('audio'))audio.pause();}
  });
}
