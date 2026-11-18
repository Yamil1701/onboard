import config from './wall-config.json';
import {parseSurvey,type SurveyPayload} from './survey-data';
type Snapshot=Omit<SurveyPayload,'token'|'answers'>&{answers:(number|null)[]|null};
const endpoint=config.url.replace(/voyageurs-wall$/,'voyageurs-surveys');
const outboxKey='voyageurs-survey-outbox',visitKey='voyageurs-survey-visit';
export function createSurveySync(onChange:()=>void){
  let token='',last='',saved='',sending=false,failed=false;
  let outbox:SurveyPayload[]=[];
  try{token=sessionStorage.getItem(visitKey)??'';const raw=JSON.parse(localStorage.getItem(outboxKey)??'[]');if(Array.isArray(raw))outbox=raw.map(parseSurvey).filter((v):v is SurveyPayload=>!!v);}catch{/* Session-only fallback. */}
  const persist=()=>{try{localStorage.setItem(outboxKey,JSON.stringify(outbox));}catch{/* Keep the live outbox in memory. */}};
  const identity=()=>{if(!token){token=crypto.randomUUID();try{sessionStorage.setItem(visitKey,token);}catch{/* Keep the live identity. */}}return token;};
  async function flush(){
    if(sending||!outbox.length||!navigator.onLine)return;
    sending=true;failed=false;onChange();
    try{
      while(outbox.length){
        const payload=outbox[0],serial=JSON.stringify(payload);
        const response=await fetch(endpoint,{method:'POST',headers:{apikey:config.key,Authorization:`Bearer ${config.key}`,'Content-Type':'application/json'},body:serial,signal:AbortSignal.timeout(12000)});
        if(!response.ok)throw new Error('sync');
        // An initial submission can be upgraded to a final survey while its request is in flight.
        outbox=outbox.filter(item=>JSON.stringify(item)!==serial);persist();
        if(payload.token===token)saved=serial;
      }
    }catch{failed=true;}finally{sending=false;onChange();}
  }
  window.addEventListener('online',()=>void flush());
  window.setInterval(()=>void flush(),30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void flush();});
  // Resume only already queued submissions, never infer answers from an old visit.
  queueMicrotask(()=>void flush());
  return {
    queue(snapshot:Snapshot){
      const payload=parseSurvey({...snapshot,token:identity()});if(!payload)return;
      const serial=JSON.stringify(payload);if(serial===last)return;last=serial;
      outbox=outbox.filter(item=>item.token!==payload.token);outbox.push(payload);persist();void flush();
    },
    newVisit(){token='';last='';saved='';failed=false;try{sessionStorage.removeItem(visitKey);}catch{/* Memory fallback. */}},
    status(language:'ar'|'fr',replay=false){
      if(replay)return language==='ar'?'Modo revivir · sin enviar respuestas.':'Mode souvenir · sans envoyer de réponses.';
      const pending=outbox.some(item=>item.token===token);
      if(pending)return language==='ar'?(failed||!navigator.onLine?'Guardado en este dispositivo. Se enviará cuando haya conexión.':'Enviando tu respuesta…'):(failed||!navigator.onLine?'Conservé sur cet appareil. Envoi dès le retour de la connexion.':'Envoi de ta réponse…');
      if(saved)return language==='ar'?'Respuesta recibida. ¡Gracias!':'Réponse reçue. Merci !';
      return '';
    },
  };
}
