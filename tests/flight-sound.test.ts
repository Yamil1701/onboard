import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {flightEnvelope,flightTiming,takeoffDuration,landingTiming} from '../src/flight-timing.ts';
test('the jet sound covers acceleration, liftoff, climb and the complete visual fade',()=>{
  const plan=flightEnvelope('takeoff');assert.equal(plan[0][0],0);assert.equal(plan.at(-1)![0],takeoffDuration);
  assert.ok(plan.some(p=>p[0]===flightTiming.runway));assert.ok(plan.some(p=>p[0]===flightTiming.liftoff));
  assert.ok(takeoffDuration>=flightTiming.liftoff+flightTiming.climb+flightTiming.fade);
  assert.ok(plan.filter(p=>p[0]<takeoffDuration).every(p=>p[2]>0));
  assert.equal(plan.at(-1)![2],0);
});
test('landing shares the turbine timbre and finishes after its touchdown',()=>{
  const takeoff=flightEnvelope('takeoff'),landing=flightEnvelope('landing');
  assert.equal(landing[0][1],takeoff.at(-2)![1]);assert.ok(landing.some(p=>p[0]===landingTiming.touchdown));
  assert.equal(landing.at(-1)![0],landingTiming.exit);assert.equal(landing.at(-1)![2],0);
  for(const point of [...takeoff,...landing])assert.ok(point[2]>=0&&point[2]<=.15);
});
