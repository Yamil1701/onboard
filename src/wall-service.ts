import config from './wall-config.json';
import type { Language } from './copy';
export type Footprint = { id: string; message: string; created_at: string; status?: string };
const headers = { apikey: config.key, Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' };
export async function readWall(): Promise<Footprint[]> {
  const response=await fetch(config.url,{headers,signal:AbortSignal.timeout(12000)});
  if(!response.ok) throw new Error('unavailable');
  const result=await response.json();
  if(!Array.isArray(result.entries)) throw new Error('unavailable');
  return result.entries.filter((row: Footprint)=>typeof row.id==='string'&&typeof row.message==='string'&&row.message.length<=320);
}
export async function postFootprint(message: string, language: Language, token: string): Promise<Footprint> {
  const response=await fetch(config.url,{method:'POST',headers,body:JSON.stringify({message,language,token}),signal:AbortSignal.timeout(12000)});
  const result=await response.json();
  if(!response.ok) throw new Error(result.error ?? 'unavailable');
  if(!result.entry || typeof result.entry.id!=='string') throw new Error('unavailable');
  return result.entry;
}
