import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {parseSurvey} from '../src/survey-data.ts';
import {issueSession,validSession,pinDigest} from '../backend/voyageurs-surveys/session.ts';
const initial={token:'84fc1afc-c179-40b7-bf68-2ddd3eed0a1a',language:'ar',expectation:'play',answers:null,rating:null};
test('only anonymous, valid completed answers and optional ratings reach survey intake',()=>{
  assert.deepEqual(parseSurvey({...initial,name:'Private Name',message:'A private note'}),initial);
  assert.ok(parseSurvey({...initial,answers:[0,1,2,0,2],rating:5}));
  for(const change of [{token:'x'},{language:'en'},{expectation:'x'},{answers:[0,1]},{answers:[0,1,2,null,1]},{answers:[0,1,2,3,1]},{rating:5},{answers:[0,1,2,0,1],rating:0},{answers:[0,1,2,0,1],rating:6}])assert.equal(parseSurvey({...initial,...change}),null);
});
test('results sessions are signed, expire and cannot be forged by changing the date or key',async()=>{
  const now=Date.now(),token=await issueSession('server-only-test-key',now);
  assert.equal(await validSession(token,'server-only-test-key',now+100),true);
  assert.equal(await validSession(token,'wrong-key',now+100),false);
  assert.equal(await validSession(token,'server-only-test-key',now+3600000),false);
  assert.equal(await validSession(token.replace(/^\d+/,String(now+7200000)),'server-only-test-key',now),false);
  assert.equal(await validSession(token+'x','server-only-test-key',now),false);
  assert.equal(await validSession('','server-only-test-key',now),false);
});
test('PIN digest depends on the private salt and entered PIN',async()=>{
  assert.equal(await pinDigest('1234','salt-a'),await pinDigest('1234','salt-a'));
  assert.notEqual(await pinDigest('1234','salt-a'),await pinDigest('1234','salt-b'));
  assert.notEqual(await pinDigest('1234','salt-a'),await pinDigest('1235','salt-a'));
});
