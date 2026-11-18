import config from './wall-config.json';
import type { Language } from './copy';
export type Footprint={id:string;message:string;created_at:string;status?:string};
export type WallCursor={date:string;id:string};
const headers={apikey:config.key,Authorization:`Bearer ${config.key}`,'Content-Type':'application/json'};
export async function readWall(cursor:WallCursor|null=null):Promise<{entries:Footprint[];nextCursor:WallCursor|null}>{
  const url=new URL(config.url);if(cursor){url.searchParams.set('before',cursor.date);url.searchParams.set('beforeId',cursor.id);}
  const response=await fetch(url,{headers,signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('unavailable');
  const result=await response.json();if(!Array.isArray(result.entries))throw new Error('unavailable');
  return {entries:result.entries.filter((row:Footprint)=>row&&typeof row.id==='string'&&typeof row.message==='string'&&row.message.length<=320),nextCursor:result.nextCursor??null};
}
export async function postFootprint(message:string,language:Language,token:string):Promise<Footprint>{
  const response=await fetch(config.url,{method:'POST',headers,body:JSON.stringify({message,language,token}),signal:AbortSignal.timeout(12000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error??'unavailable');
  if(!result.entry||typeof result.entry.id!=='string')throw new Error('unavailable');return result.entry;
}
