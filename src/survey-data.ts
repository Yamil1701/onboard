export type Expectation='adapt'|'play'|'ideas';
export type SurveyPayload={token:string;language:'ar'|'fr';expectation:Expectation;answers:number[]|null;rating:number|null};
export const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseSurvey(value:unknown):SurveyPayload|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const v=value as Record<string,unknown>;
  if(typeof v.token!=='string'||!uuidPattern.test(v.token)||(v.language!=='ar'&&v.language!=='fr')||!['adapt','play','ideas'].includes(String(v.expectation)))return null;
  if(v.answers!==null&&(!Array.isArray(v.answers)||v.answers.length!==5||!v.answers.every(a=>a===0||a===1||a===2)))return null;
  if(v.rating!==null&&(typeof v.rating!=='number'||!Number.isInteger(v.rating)||v.rating<1||v.rating>5||v.answers===null))return null;
  // Only these fields ever leave the visitor's device. Names and wall notes stay separate.
  return {token:v.token,language:v.language,expectation:v.expectation as Expectation,answers:v.answers as number[]|null,rating:v.rating as number|null};
}
