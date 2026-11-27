import type { Language } from './copy';
import penWritingUrl from './assets/pen-writing.mp3';
import {flightEnvelope,landingTiming,type FlightMode} from './flight-timing';
type Cue='tap'|'paper'|'stamp'|'success'|'error'|'finish'|'letter'|'whoosh'|'pen'|'touchdown';
let context:AudioContext|undefined,master:GainNode|undefined,muted=false,language:Language='ar';
let noise:AudioBuffer|undefined;
let penBuffer:AudioBuffer|undefined,penLoad:Promise<void>|undefined;
function loadPen(ctx:AudioContext){
  return penLoad??=fetch(penWritingUrl).then(response=>{if(!response.ok)throw new Error('pen');return response.arrayBuffer();}).then(bytes=>ctx.decodeAudioData(bytes)).then(buffer=>{penBuffer=buffer;}).catch(()=>{penLoad=undefined;});
}
let flight:{mode:FlightMode;started:number;nodes:AudioScheduledSourceNode[]}|undefined;
const key='voyageurs-sound-muted';
try{muted=localStorage.getItem(key)==='true';}catch{/* Keep this visit's preference. */}
function audioContext(){
  if(!context){const Constructor=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
    if(Constructor){context=new Constructor();master=context.createGain();master.gain.value=muted?0:.7;master.connect(context.destination);void loadPen(context);}}
  return context;
}
function tone(ctx:AudioContext,freq:number,start:number,duration:number,volume:number,end=freq,type:OscillatorType='sine'){
  const node=ctx.createOscillator(),gain=ctx.createGain();node.type=type;node.frequency.setValueAtTime(freq,start);node.frequency.exponentialRampToValueAtTime(end,start+duration);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  node.connect(gain).connect(master!);node.start(start);node.stop(start+duration+.02);return node;
}
function noiseBuffer(ctx:AudioContext){
  if(!noise){noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}
  return noise;
}
function air(ctx:AudioContext,start:number,duration:number,volume:number,frequency:number,end=frequency/3){
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=noiseBuffer(ctx);source.loop=true;filter.type='lowpass';filter.frequency.setValueAtTime(frequency,start);filter.frequency.exponentialRampToValueAtTime(Math.max(30,end),start+duration);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+Math.min(.12,duration/4));gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  source.connect(filter).connect(gain).connect(master!);source.start(start);source.stop(start+duration);return source;
}
export function sound(cue:Cue,delay=0){
  if(muted||document.hidden||!context||context.state!=='running')return;
  const t=context.currentTime+delay;
  if(cue==='tap')tone(context,680,t,.045,.018,440);
  if(cue==='letter'){air(context,t,.036,.095,2300);tone(context,210,t,.04,.028,150);}
  if(cue==='paper')air(context,t,.36,.09,2200);
  if(cue==='whoosh')air(context,t,.7,.11,300,1800);
  if(cue==='pen'){
    if(penBuffer){const source=context.createBufferSource(),gain=context.createGain();source.buffer=penBuffer;gain.gain.value=.18;source.connect(gain).connect(master!);source.start(t);}
    else {
      // Smooth friction fallback: one continuous stroke, without taps or pulses.
      const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=noiseBuffer(context);filter.type='bandpass';filter.frequency.value=2100;filter.Q.value=.65;
      gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.018,t+.05);gain.gain.linearRampToValueAtTime(.01,t+.3);gain.gain.linearRampToValueAtTime(.016,t+.48);gain.gain.linearRampToValueAtTime(0,t+.7);
      source.connect(filter).connect(gain).connect(master!);source.start(t);source.stop(t+.72);
    }
  }
  if(cue==='stamp'){tone(context,95,t,.34,.2,42);air(context,t,.085,.25,700);air(context,t+.045,.2,.08,2300);}
  if(cue==='touchdown'){tone(context,65,t,.45,.15,40);air(context,t,.55,.18,800);}
  if(cue==='error')tone(context,240,t,.16,.035,190);
  if(cue==='success'||cue==='finish'){tone(context,440,t,.4,.04);tone(context,554,t+.12,.4,.035);tone(context,660,t+.24,.7,.03);}
}
function playFlight(){
  if(!flight||flight.nodes.length||!context||context.state!=='running'||muted||document.hidden)return;
  const ctx=context,t=ctx.currentTime,offset=(performance.now()-flight.started)/1000;
  const points=flightEnvelope(flight.mode),duration=points.at(-1)![0];if(offset>=duration)return;
  const a=[...points].reverse().find(p=>p[0]<=offset)??points[0],b=points.find(p=>p[0]>offset)??a;
  const fraction=b[0]===a[0]?0:(offset-a[0])/(b[0]-a[0]);
  const value=(column:number)=>a[column]+(b[column]-a[column])*fraction;
  const wind=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),windGain=ctx.createGain();wind.buffer=noiseBuffer(ctx);wind.loop=true;filter.type='lowpass';filter.Q.value=.7;
  windGain.gain.setValueAtTime(value(2),t);filter.frequency.setValueAtTime(value(3),t);
  wind.connect(filter).connect(windGain).connect(master!);wind.start(t);wind.stop(t+duration-offset+.05);flight.nodes.push(wind);
  for(const p of points.filter(p=>p[0]>offset)){windGain.gain.linearRampToValueAtTime(p[2],t+p[0]-offset);filter.frequency.linearRampToValueAtTime(p[3],t+p[0]-offset);}
  for(const multiplier of [1,1.027,2.03]){
    const turbine=ctx.createOscillator(),lowpass=ctx.createBiquadFilter(),gain=ctx.createGain();turbine.type='sawtooth';lowpass.type='lowpass';lowpass.frequency.value=370;gain.gain.setValueAtTime(.006+value(2)*.08,t);
    turbine.frequency.setValueAtTime(value(1)*multiplier,t);turbine.connect(lowpass).connect(gain).connect(master!);
    for(const p of points.filter(p=>p[0]>offset)){turbine.frequency.linearRampToValueAtTime(p[1]*multiplier,t+p[0]-offset);gain.gain.linearRampToValueAtTime(p[2]===0?0:.006+p[2]*.08,t+p[0]-offset);}
    turbine.start(t);turbine.stop(t+duration-offset+.05);flight.nodes.push(turbine);
  }
  if(flight.mode==='landing'&&offset<landingTiming.touchdown){flight.nodes.push(tone(ctx,65,t+landingTiming.touchdown-offset,.45,.15,40));flight.nodes.push(air(ctx,t+landingTiming.touchdown-offset,.5,.18,800));}
}
export function startFlightSound(mode:FlightMode){stopFlightSound();flight={mode,started:performance.now(),nodes:[]};playFlight();}
export function stopFlightSound(){for(const node of flight?.nodes??[])try{node.stop();}catch{/* It already ended. */}flight=undefined;}
function render(){
  const button=document.querySelector<HTMLButtonElement>('#sound-toggle');if(!button)return;
  button.setAttribute('aria-pressed',String(muted));button.setAttribute('aria-label',language==='ar'?(muted?'Activar sonidos':'Silenciar sonidos'):(muted?'Activer les sons':'Couper les sons'));
  if(context&&master)master.gain.setTargetAtTime(muted?0:.7,context.currentTime,.015);
  for(const media of document.querySelectorAll<HTMLMediaElement>('audio,video'))media.muted=muted;
}
export function translateSound(lang:Language){language=lang;render();}
export function initSound(){
  render();const unlock=()=>{if(muted)return;try{const ctx=audioContext();if(ctx?.state==='suspended')void ctx.resume().then(playFlight).catch(()=>{});else playFlight();}catch{/* Audio is optional. */}};
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  document.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')unlock();},{capture:true});
  document.querySelector('#sound-toggle')?.addEventListener('click',()=>{muted=!muted;try{localStorage.setItem(key,String(muted));}catch{/* Memory preference remains. */}if(!muted)unlock();render();});
  document.addEventListener('click',event=>{const target=event.target instanceof Element?event.target.closest('button,summary,input[type="radio"]'):null;if(target&&target.id!=='sound-toggle'&&!target.hasAttribute('disabled'))sound('tap');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopFlightSound();void context?.suspend();for(const media of document.querySelectorAll<HTMLMediaElement>('audio,video'))media.pause();}});
}
