const encode=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function sign(value:string,secret:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return encode(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))));}
export async function issueSession(secret:string,now=Date.now()){const payload=`${now+60*60*1000}:${crypto.randomUUID()}`;return `${payload}.${await sign(payload,secret)}`;}
export async function validSession(token:string,secret:string,now=Date.now()){
  if(token.length>200)return false;const parts=token.split('.');if(parts.length!==2)return false;
  const expires=Number(parts[0].split(':')[0]);if(!Number.isFinite(expires)||expires<=now||expires>now+60*60*1000)return false;
  const expected=await sign(parts[0],secret);if(expected.length!==parts[1].length)return false;
  let difference=0;for(let i=0;i<expected.length;i++)difference|=expected.charCodeAt(i)^parts[1].charCodeAt(i);return difference===0;
}
export async function pinDigest(pin:string,salt:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${salt}:${pin}`)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
